import { dialog } from 'electron'
import type { IBackgroundAssetStore } from '../../../core/ports/IBackgroundAssetStore'
import type { IConfigStore } from '../../../core/ports/IConfigStore'
import { getMonitorProfile } from '../../../core/lib/config/monitorProfiles'

export async function pickBackgroundPhotoSourcePath(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0] ?? null
}

export async function importBackgroundPhotoForMonitor(
  configStore: IConfigStore,
  assetStore: IBackgroundAssetStore,
  monitorId: string,
  sourcePath: string
): Promise<{ relPath: string }> {
  const config = await configStore.get()
  const profile = getMonitorProfile(config, monitorId)
  const relPath = await assetStore.importPersonalPhoto(monitorId, sourcePath)
  if (profile.backgroundPhotoRelPath && profile.backgroundPhotoRelPath !== relPath) {
    await assetStore.deleteAsset(profile.backgroundPhotoRelPath)
  }
  return { relPath }
}
