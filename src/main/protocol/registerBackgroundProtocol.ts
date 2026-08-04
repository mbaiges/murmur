import { protocol } from 'electron'
import type { IBackgroundAssetStore } from '../../core/ports/IBackgroundAssetStore'
import type { IConfigStore } from '../../core/ports/IConfigStore'
import { getMonitorProfile } from '../../core/lib/config/monitorProfiles'
import { parseMurmurBackgroundAssetUrl } from '../../core/lib/background/backgroundAssetUrl'
import { resolveLatestAiAbsolutePath } from '../../core/lib/background/resolveLatestAiAsset'

export function registerBackgroundProtocol(
  configStore: IConfigStore,
  assetStore: IBackgroundAssetStore
): void {
  protocol.registerFileProtocol('murmur-background', (request, callback) => {
    void (async () => {
      try {
        const parsed = parseMurmurBackgroundAssetUrl(request.url)
        if (!parsed) {
          callback({ error: -2 })
          return
        }
        const { monitorId, kind } = parsed
        const config = await configStore.get()
        const profile = getMonitorProfile(config, monitorId)

        let abs: string | null = null
        if (kind === 'personal' && profile.backgroundPhotoRelPath) {
          abs = assetStore.resolveAbsolutePath(profile.backgroundPhotoRelPath)
        } else if (kind === 'ai') {
          abs = resolveLatestAiAbsolutePath(assetStore, monitorId)
        }

        if (!abs) {
          callback({ error: -2 })
          return
        }
        callback({ path: abs })
      } catch {
        callback({ error: -2 })
      }
    })()
  })
}
