import { useMemo } from 'react'
import type { LayoutContentEnvelope, MonitorProfile } from '@core/domain/types'
import { resolvePreviewLayoutEnvelope } from '@core/lib/layout/resolvePreviewLayoutEnvelope'
import { previewScaleForFrame } from './wallpaperPreviewScale'
import WallpaperScene from './WallpaperScene'

type WallpaperPreviewContentProps = {
  config: MonitorProfile
  phrase: string
  className?: string
  frameWidthPx: number
  displayWidthPx: number
  displayHeightPx: number
  /** Last committed layout envelope (any monitor); used when draft layout matches. */
  committedLayoutEnvelope?: LayoutContentEnvelope | null
  monitorId?: string
  backgroundCacheKey?: string
}

export default function WallpaperPreviewContent({
  config,
  phrase,
  className = '',
  frameWidthPx,
  displayWidthPx,
  displayHeightPx,
  committedLayoutEnvelope = null,
  monitorId,
  backgroundCacheKey
}: WallpaperPreviewContentProps) {
  const displayW = displayWidthPx > 0 ? displayWidthPx : 1920
  const displayH = displayHeightPx > 0 ? displayHeightPx : 1080
  const scale = previewScaleForFrame(frameWidthPx, displayW)

  const layoutEnvelope = useMemo(
    () => resolvePreviewLayoutEnvelope(config.layoutStyle, phrase, committedLayoutEnvelope),
    [config.layoutStyle, phrase, committedLayoutEnvelope]
  )

  return (
    <div className={`relative h-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="relative origin-top-left"
          style={{
            width: displayW,
            height: displayH,
            transform: `scale(${scale})`
          }}
        >
          <WallpaperScene
            profile={config}
            phrase={phrase}
            layoutEnvelope={layoutEnvelope}
            layoutWidthPx={displayW}
            staticFrame
            monitorId={monitorId}
            lastRefreshTime={backgroundCacheKey ?? null}
          />
        </div>
      </div>
    </div>
  )
}
