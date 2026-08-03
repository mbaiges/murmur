import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  AppUpdateInfo,
  MURMUR_RELEASES_URL,
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

function baseInfo(currentVersion: string, phase: AppUpdateInfo['phase'] = 'idle'): AppUpdateInfo {
  return {
    phase,
    currentVersion,
    releasesUrl: MURMUR_RELEASES_URL
  }
}

export function createAppUpdater(options: {
  e2eMode: boolean
  broadcast: (info: AppUpdateInfo) => void
  notifier?: IUpdateReadyNotifier
}): AppUpdater {
  const currentVersion = app.getVersion()
  const enabled = shouldEnableAppUpdate(app.isPackaged, options.e2eMode)

  let info: AppUpdateInfo = enabled
    ? baseInfo(currentVersion, 'idle')
    : baseInfo(currentVersion, 'disabled')

  let quitForUpdate = false
  let periodicTimer: ReturnType<typeof setInterval> | undefined
  let lastNotifiedVersion: string | null = null

  const publish = (patch: Partial<AppUpdateInfo>) => {
    info = { ...info, ...patch }
    options.broadcast(info)
  }

  if (!enabled) {
    return {
      start: () => {},
      getInfo: () => info,
      check: async () => info,
      quitAndInstall: () => {},
      finishQuitAfterRestore: () => app.exit(0)
    }
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
