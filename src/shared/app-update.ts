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
}

export const MURMUR_RELEASES_URL = 'https://github.com/mbaiges/murmur/releases'

export function shouldEnableAppUpdate(appPackaged: boolean, e2eMode: boolean): boolean {
  return appPackaged && !e2eMode
}

/** Notify at most once per downloaded version (functional AC 5). */
export function shouldNotifyForVersion(lastNotifiedVersion: string | null, version: string): boolean {
  return lastNotifiedVersion !== version
}
