import type { MonitorProfile } from '../../domain/types'
import type { IBackgroundAssetStore } from '../../ports/IBackgroundAssetStore'
import { resolveBackgroundPaintInput } from './resolveBackgroundBase'
import { resolveLatestAiAbsolutePath } from './resolveLatestAiAsset'

export function resolveMonitorBackgroundPaint(
  profile: MonitorProfile,
  monitorId: string,
  store: IBackgroundAssetStore
): ReturnType<typeof resolveBackgroundPaintInput> {
  const personal =
    profile.backgroundMode === 'photo' && profile.backgroundPhotoRelPath
      ? store.resolveAbsolutePath(profile.backgroundPhotoRelPath)
      : null
  const ai =
    profile.backgroundMode === 'ai' ? resolveLatestAiAbsolutePath(store, monitorId) : null
  return resolveBackgroundPaintInput(profile, { personal, ai })
}
