import React, { useMemo } from 'react'
import type { LayoutContentEnvelope, MurmurConfig } from '@core/domain/types'
import { resolvePreviewLayoutEnvelope } from '@core/lib/layout/resolvePreviewLayoutEnvelope'
import { themePreviewBackgroundClass } from './wallpaperThemePreview'
import { previewScaleForFrame } from './wallpaperPreviewScale'
import WallpaperPreviewLayoutBody from './WallpaperPreviewLayoutBody'

type WallpaperPreviewContentProps = {
  config: MurmurConfig
  phrase: string
  className?: string
  frameWidthPx: number
  displayWidthPx: number
  displayHeightPx: number
  /** Last committed layout envelope (any monitor); used when draft layout matches. */
  committedLayoutEnvelope?: LayoutContentEnvelope | null
}

export default function WallpaperPreviewContent({
  config,
  phrase,
  className = '',
  frameWidthPx,
  displayWidthPx,
  displayHeightPx,
  committedLayoutEnvelope = null
}: WallpaperPreviewContentProps) {
  const displayW = displayWidthPx > 0 ? displayWidthPx : 1920
  const displayH = displayHeightPx > 0 ? displayHeightPx : 1080
  const scale = previewScaleForFrame(frameWidthPx, displayW)

  const layoutEnvelope = useMemo(
    () => resolvePreviewLayoutEnvelope(config.layoutStyle, phrase, committedLayoutEnvelope),
    [config.layoutStyle, phrase, committedLayoutEnvelope]
  )

  const replayKey = useMemo(
    () =>
      [
        config.layoutStyle,
        config.animation,
        config.audioFeedback,
        config.textAlignment,
        config.fontFamily,
        phrase
      ].join('|'),
    [
      config.layoutStyle,
      config.animation,
      config.audioFeedback,
      config.textAlignment,
      config.fontFamily,
      phrase
    ]
  )

  return (
    <div
      className={`relative h-full overflow-hidden rounded-lg border border-slate-700/50 ${themePreviewBackgroundClass(config.theme)} ${className}`}
    >
      {config.vignetteStyle !== 'none' && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 ${
            config.vignetteStyle === 'dramatic'
              ? 'bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.75)_100%)]'
              : config.vignetteStyle === 'medium'
                ? 'bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.5)_100%)]'
                : 'bg-[radial-gradient(circle,transparent_55%,rgba(0,0,0,0.35)_100%)]'
          }`}
        />
      )}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="relative origin-top-left"
          style={{
            width: displayW,
            height: displayH,
            transform: `scale(${scale})`
          }}
        >
          <WallpaperPreviewLayoutBody
            config={config}
            phrase={phrase}
            layoutEnvelope={layoutEnvelope}
            replayKey={replayKey}
          />
        </div>
      </div>
    </div>
  )
}
