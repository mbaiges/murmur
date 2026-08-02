import React from 'react'
import type { MurmurConfig } from '@core/domain/types'
import WallpaperPreviewContent from '../../wallpaper/WallpaperPreviewContent'

type StyleMiniPreviewProps = {
  config: MurmurConfig
  phrase: string
}

export default function StyleMiniPreview({ config, phrase }: StyleMiniPreviewProps) {
  return (
    <div className="sticky top-0 z-30 -mx-1 mb-6" data-testid="style-mini-preview">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Preview</p>
      <WallpaperPreviewContent config={config} phrase={phrase} className="w-full max-w-md shadow-lg" />
      <p className="text-[10px] text-slate-600 mt-1.5">Uses your current phrase; Apply to update the desktop.</p>
    </div>
  )
}
