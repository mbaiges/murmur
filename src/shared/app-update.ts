/** Update status shared by main process and renderer (IPC-safe). */

export type AppUpdatePhase =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface AppUpdateInfo {
  phase: AppUpdatePhase
  currentVersion: string
  availableVersion?: string
  downloadPercent?: number
  errorMessage?: string
  releasesUrl: string
  /** Windows: electron-updater. macOS (unsigned): user installs from GitHub Releases. */
  updateMode: AppUpdateMode
}

export type AppUpdateMode = 'in-app' | 'manual-releases'

export const MURMUR_RELEASES_URL = 'https://github.com/mbaiges/murmur/releases'

export const MURMUR_LATEST_RELEASE_API =
  'https://api.github.com/repos/mbaiges/murmur/releases/latest'

export function appUpdateModeForPlatform(platform: NodeJS.Platform): AppUpdateMode {
  return platform === 'win32' ? 'in-app' : 'manual-releases'
}

export function shouldEnableAppUpdate(appPackaged: boolean, e2eMode: boolean): boolean {
  return appPackaged && !e2eMode
}

/** Semver-ish compare (major.minor.patch). */
export function isNewerReleaseVersion(latest: string, current: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('.')
      .map((part) => parseInt(part, 10) || 0)
  const a = parse(latest)
  const b = parse(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) {
      return diff > 0
    }
  }
  return false
}

/** Notify at most once per downloaded version (functional AC 5). */
export function shouldNotifyForVersion(lastNotifiedVersion: string | null, version: string): boolean {
  return lastNotifiedVersion !== version
}
