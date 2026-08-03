import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  AppUpdateInfo,
  AppUpdateMode,
  MURMUR_LATEST_RELEASE_API,
  MURMUR_RELEASES_URL,
  appUpdateModeForPlatform,
  isNewerReleaseVersion,
  shouldEnableAppUpdate,
  shouldNotifyForVersion
} from '@shared/app-update'
import type { IUpdateReadyNotifier } from '@core/ports/IUpdateReadyNotifier'

const INITIAL_CHECK_DELAY_MS = 30_000
const PERIODIC_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

export type AppUpdater = {
  start: () => void
  getInfo: () => AppUpdateInfo
  check: () => Promise<AppUpdateInfo>
  quitAndInstall: () => void
  finishQuitAfterRestore: () => void
}

function baseInfo(
  currentVersion: string,
  updateMode: AppUpdateMode,
  phase: AppUpdateInfo['phase'] = 'idle'
): AppUpdateInfo {
  return {
    phase,
    currentVersion,
    releasesUrl: MURMUR_RELEASES_URL,
    updateMode
  }
}

async function fetchLatestGitHubReleaseVersion(currentVersion: string): Promise<string | null> {
  const response = await fetch(MURMUR_LATEST_RELEASE_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `Murmur/${currentVersion}`
    }
  })
  if (!response.ok) {
    return null
  }
  const body = (await response.json()) as { tag_name?: string }
  const tag = body.tag_name?.replace(/^v/i, '')
  return tag || null
}

function createManualReleasesUpdater(options: {
  currentVersion: string
  broadcast: (info: AppUpdateInfo) => void
}): AppUpdater {
  let info: AppUpdateInfo = baseInfo(options.currentVersion, 'manual-releases', 'idle')
  let periodicTimer: ReturnType<typeof setInterval> | undefined

  const publish = (patch: Partial<AppUpdateInfo>) => {
    info = { ...info, ...patch }
    options.broadcast(info)
  }

  const runCheck = async (): Promise<AppUpdateInfo> => {
    publish({ phase: 'checking', errorMessage: undefined })
    try {
      const latest = await fetchLatestGitHubReleaseVersion(options.currentVersion)
      if (!latest) {
        publish({
          phase: 'error',
          errorMessage: 'Could not load the latest release from GitHub.'
        })
        return info
      }
      if (isNewerReleaseVersion(latest, options.currentVersion)) {
        publish({ phase: 'available', availableVersion: latest })
      } else {
        publish({ phase: 'not-available', availableVersion: undefined })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      publish({ phase: 'error', errorMessage: message })
    }
    return info
  }

  return {
    start: () => {
      setTimeout(() => {
        void runCheck()
      }, INITIAL_CHECK_DELAY_MS)
      periodicTimer = setInterval(() => {
        void runCheck()
      }, PERIODIC_CHECK_INTERVAL_MS)
      periodicTimer.unref?.()
    },
    getInfo: () => info,
    check: runCheck,
    quitAndInstall: () => {},
    finishQuitAfterRestore: () => app.exit(0)
  }
}

function createInAppUpdater(options: {
  currentVersion: string
  broadcast: (info: AppUpdateInfo) => void
  notifier?: IUpdateReadyNotifier
}): AppUpdater {
  let info: AppUpdateInfo = baseInfo(options.currentVersion, 'in-app', 'idle')
  let quitForUpdate = false
  let periodicTimer: ReturnType<typeof setInterval> | undefined
  let lastNotifiedVersion: string | null = null

  const publish = (patch: Partial<AppUpdateInfo>) => {
    info = { ...info, ...patch }
    options.broadcast(info)
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowPrerelease = false

  autoUpdater.on('checking-for-update', () => {
    publish({ phase: 'checking', errorMessage: undefined })
  })
  autoUpdater.on('update-available', (update) => {
    publish({ phase: 'available', availableVersion: update.version })
  })
  autoUpdater.on('update-not-available', () => {
    publish({ phase: 'not-available', availableVersion: undefined })
  })
  autoUpdater.on('download-progress', (progress) => {
    publish({
      phase: 'downloading',
      downloadPercent: progress.percent
    })
  })
  autoUpdater.on('update-downloaded', (update) => {
    publish({
      phase: 'downloaded',
      availableVersion: update.version,
      downloadPercent: 100
    })
    if (
      options.notifier &&
      shouldNotifyForVersion(lastNotifiedVersion, update.version)
    ) {
      lastNotifiedVersion = update.version
      options.notifier.notifyReadyToInstall({ version: update.version })
    }
  })
  autoUpdater.on('error', (error) => {
    const message = error instanceof Error ? error.message : String(error)
    publish({ phase: 'error', errorMessage: message })
  })

  const runCheck = async (): Promise<AppUpdateInfo> => {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      publish({ phase: 'error', errorMessage: message })
    }
    return info
  }

  return {
    start: () => {
      setTimeout(() => {
        void runCheck()
      }, INITIAL_CHECK_DELAY_MS)
      periodicTimer = setInterval(() => {
        void runCheck()
      }, PERIODIC_CHECK_INTERVAL_MS)
      periodicTimer.unref?.()
    },
    getInfo: () => info,
    check: runCheck,
    quitAndInstall: () => {
      if (info.phase !== 'downloaded') {
        return
      }
      quitForUpdate = true
      app.quit()
    },
    finishQuitAfterRestore: () => {
      if (quitForUpdate) {
        autoUpdater.quitAndInstall(false, true)
        return
      }
      app.exit(0)
    }
  }
}

export function createAppUpdater(options: {
  e2eMode: boolean
  platform?: NodeJS.Platform
  broadcast: (info: AppUpdateInfo) => void
  notifier?: IUpdateReadyNotifier
}): AppUpdater {
  const currentVersion = app.getVersion()
  const updateMode = appUpdateModeForPlatform(options.platform ?? process.platform)
  const enabled = shouldEnableAppUpdate(app.isPackaged, options.e2eMode)

  const disabledInfo = baseInfo(currentVersion, updateMode, 'disabled')

  if (!enabled) {
    return {
      start: () => {},
      getInfo: () => disabledInfo,
      check: async () => disabledInfo,
      quitAndInstall: () => {},
      finishQuitAfterRestore: () => app.exit(0)
    }
  }

  if (updateMode === 'manual-releases') {
    return createManualReleasesUpdater({
      currentVersion,
      broadcast: options.broadcast
    })
  }

  return createInAppUpdater({
    currentVersion,
    broadcast: options.broadcast,
    notifier: options.notifier
  })
}
