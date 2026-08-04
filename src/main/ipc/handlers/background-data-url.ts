import { readFileSync } from 'fs'
import { extname } from 'path'
import type { IBackgroundAssetStore } from '../../../core/ports/IBackgroundAssetStore'
import type { IConfigStore } from '../../../core/ports/IConfigStore'
import { getMonitorProfile } from '../../../core/lib/config/monitorProfiles'
import { resolveLatestAiAbsolutePath } from '../../../core/lib/background/resolveLatestAiAsset'

export type BackgroundImageKind = 'personal' | 'ai'

function mimeForPath(absPath: string): string {
  const ext = extname(absPath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

export function resolveBackgroundImageAbsolutePath(
  configStore: IConfigStore,
  assetStore: IBackgroundAssetStore,
  monitorId: string,
  kind: BackgroundImageKind
): Promise<string | null> {
  return configStore.get().then((config) => {
    const profile = getMonitorProfile(config, monitorId)
    if (kind === 'personal' && profile.backgroundPhotoRelPath) {
      return assetStore.resolveAbsolutePath(profile.backgroundPhotoRelPath)
    }
    if (kind === 'ai') {
      return resolveLatestAiAbsolutePath(assetStore, monitorId)
    }
    return null
  })
}

export async function readBackgroundDataUrl(
  configStore: IConfigStore,
  assetStore: IBackgroundAssetStore,
  monitorId: string,
  kind: BackgroundImageKind
): Promise<string | null> {
  const abs = await resolveBackgroundImageAbsolutePath(configStore, assetStore, monitorId, kind)
  if (!abs) return null
  try {
    const buf = readFileSync(abs)
    const mime = mimeForPath(abs)
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch (error) {
    console.warn('readBackgroundDataUrl: failed to read', abs, error)
    return null
  }
}
