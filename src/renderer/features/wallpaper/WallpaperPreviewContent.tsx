import React from 'react'
import type { MurmurConfig } from '@core/domain/types'
import { phraseToPlainText } from '@core/lib/phrase/phrasePlainText'
import {
  fontFamilyPreviewClass,
  themePreviewBackgroundClass,
  themePreviewIsDark
} from './wallpaperThemePreview'

type WallpaperPreviewContentProps = {
  config: MurmurConfig
  phrase: string
  className?: string
}

export default function WallpaperPreviewContent({
  config,
  phrase,
  className = ''
}: WallpaperPreviewContentProps) {
  const plain = phraseToPlainText(phrase).trim() || 'Your phrase will appear here after refresh.'
  const dark = themePreviewIsDark(config.theme)
  const align =
    config.textAlignment === 'left'
      ? 'text-left items-start'
      : config.textAlignment === 'right'
        ? 'text-right items-end'
        : 'text-center items-center'

  return (
    <div
      className={`relative h-full overflow-hidden rounded-lg border border-slate-700/50 ${themePreviewBackgroundClass(config.theme)} ${className}`}
    >
      {config.vignetteStyle !== 'none' && (
        <div
          className={`pointer-events-none absolute inset-0 ${
            config.vignetteStyle === 'dramatic'
              ? 'bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.75)_100%)]'
              : config.vignetteStyle === 'medium'
                ? 'bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.5)_100%)]'
                : 'bg-[radial-gradient(circle,transparent_55%,rgba(0,0,0,0.35)_100%)]'
          }`}
        />
      )}
      <div className={`relative flex h-full min-h-0 flex-col justify-center px-4 py-4 ${align}`}>
        <p
          className={`text-sm leading-snug line-clamp-4 max-w-full ${fontFamilyPreviewClass(config.fontFamily)} ${
            dark ? 'text-white/90' : 'text-slate-900/90'
          }`}
        >
          {plain}
        </p>
      </div>
    </div>
  )
}
