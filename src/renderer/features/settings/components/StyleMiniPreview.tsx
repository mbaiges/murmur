import React from 'react'
import type { MurmurConfig } from '@core/domain/types'
import WallpaperPreviewContent from '../../wallpaper/WallpaperPreviewContent'
import { displayAspectRatioLabel, stylePreviewDimensions } from '../lib/stylePreviewLayout'

type StyleMiniPreviewProps = {
  config: MurmurConfig
  phrase: string
  displayWidth: number
  displayHeight: number
  visible: boolean
  onToggleVisible: (visible: boolean) => void
}

export default function StyleMiniPreview({
  config,
  phrase,
  displayWidth,
  displayHeight,
  visible,
  onToggleVisible
}: StyleMiniPreviewProps) {
  const { width, height, aspectRatio } = stylePreviewDimensions(displayWidth, displayHeight)
  const ratioLabel = displayAspectRatioLabel(displayWidth, displayHeight)

  if (!visible) {
    return (
      <div className="mb-4" data-testid="style-mini-preview-collapsed">
        <button
          type="button"
          data-testid="style-mini-preview-show"
          onClick={() => onToggleVisible(true)}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
        >
          Show wallpaper preview ({ratioLabel})
        </button>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-30 -mx-1 mb-6" data-testid="style-mini-preview">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Preview</p>
          <p className="text-[10px] text-slate-600">Primary display · {ratioLabel}</p>
        </div>
        <button
          type="button"
          data-testid="style-mini-preview-hide"
          onClick={() => onToggleVisible(false)}
          className="text-[10px] font-medium text-slate-500 hover:text-slate-300"
        >
          Hide preview
        </button>
      </div>
      <div
        className="shadow-lg"
        style={{ width, height, maxWidth: '100%', aspectRatio }}
        data-testid="style-mini-preview-frame"
      >
        <WallpaperPreviewContent config={config} phrase={phrase} className="w-full h-full" />
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5">Uses your current phrase; Apply to update the desktop.</p>
    </div>
  )
}
