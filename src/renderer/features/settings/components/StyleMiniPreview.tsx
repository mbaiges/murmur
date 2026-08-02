import React, { useEffect, useRef, useState } from 'react'
import type { LayoutContentEnvelope, MonitorProfile } from '@core/domain/types'
import WallpaperPreviewContent from '../../wallpaper/WallpaperPreviewContent'
import { displayAspectRatioLabel, stylePreviewDimensions } from '../lib/stylePreviewLayout'

const COMPACT_THUMB_MAX_WIDTH = 88

type StyleMiniPreviewProps = {
  config: MonitorProfile
  phrase: string
  displayWidth: number
  displayHeight: number
  committedLayoutEnvelope?: LayoutContentEnvelope | null
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

function PreviewFrame({
  frameWidth,
  frameHeight,
  aspectRatio,
  config,
  phrase,
  displayWidth,
  displayHeight,
  committedLayoutEnvelope,
  testId
}: {
  frameWidth: number
  frameHeight: number
  aspectRatio: string
  config: MonitorProfile
  phrase: string
  displayWidth: number
  displayHeight: number
  committedLayoutEnvelope?: LayoutContentEnvelope | null
  testId?: string
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [paintedWidth, setPaintedWidth] = useState(frameWidth)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setPaintedWidth(w)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [frameWidth, frameHeight])

  return (
    <div
      ref={frameRef}
      className="overflow-hidden rounded-lg border border-slate-700/80 shadow-lg shadow-black/40"
      style={{ width: frameWidth, height: frameHeight, maxWidth: '100%', aspectRatio }}
      data-testid={testId}
    >
      <WallpaperPreviewContent
        config={config}
        phrase={phrase}
        className="w-full h-full"
        frameWidthPx={paintedWidth}
        displayWidthPx={displayWidth}
        displayHeightPx={displayHeight}
        committedLayoutEnvelope={committedLayoutEnvelope}
      />
    </div>
  )
}

export default function StyleMiniPreview({
  config,
  phrase,
  displayWidth,
  displayHeight,
  committedLayoutEnvelope,
  scrollContainerRef
}: StyleMiniPreviewProps) {
  const { width, height, aspectRatio } = stylePreviewDimensions(displayWidth, displayHeight)
  const ratioLabel = displayAspectRatioLabel(displayWidth, displayHeight)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrollCompact, setScrollCompact] = useState(false)
  const [floatingOpen, setFloatingOpen] = useState(false)

  useEffect(() => {
    const root = scrollContainerRef?.current ?? null
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const compact = !entry.isIntersecting
        setScrollCompact(compact)
        if (!compact) setFloatingOpen(false)
      },
      { root, threshold: 0, rootMargin: '0px 0px -24px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [scrollContainerRef])

  const compactThumbHeight = Math.round(COMPACT_THUMB_MAX_WIDTH * (height / width))

  const previewFrame = (frameWidth: number, frameHeight: number, testId?: string) => (
    <PreviewFrame
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      aspectRatio={aspectRatio}
      config={config}
      phrase={phrase}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      committedLayoutEnvelope={committedLayoutEnvelope}
      testId={testId}
    />
  )

  return (
    <>
      <div className="mb-6" data-testid="style-mini-preview">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Preview</p>
            <p className="text-[10px] text-slate-600">Primary display · {ratioLabel}</p>
          </div>
        </div>
        {previewFrame(width, height, 'style-mini-preview-frame')}
        <p className="text-[10px] text-slate-600 mt-1.5">Uses your current phrase; Apply to update the desktop.</p>
        <div ref={sentinelRef} className="h-px w-full" aria-hidden data-testid="style-mini-preview-sentinel" />
      </div>

      {scrollCompact && (
        <div className="fixed top-12 right-8 z-40 flex flex-col items-end gap-2 pointer-events-none">
          {!floatingOpen && (
            <button
              type="button"
              data-testid="style-mini-preview-compact"
              onClick={() => setFloatingOpen(true)}
              className="pointer-events-auto group flex flex-col items-stretch rounded-xl border border-slate-700/90 bg-slate-900/95 backdrop-blur-md p-1.5 shadow-lg shadow-black/50 transition hover:border-indigo-500/60"
              title={`Show wallpaper preview (${ratioLabel})`}
            >
              {previewFrame(COMPACT_THUMB_MAX_WIDTH, compactThumbHeight)}
              <span className="mt-1 px-1 text-[9px] font-medium uppercase tracking-wider text-slate-500 group-hover:text-indigo-300 text-center">
                Preview
              </span>
            </button>
          )}

          {floatingOpen && (
            <div
              className="pointer-events-auto rounded-xl border border-slate-700/90 bg-slate-900/98 backdrop-blur-md p-3 shadow-xl shadow-black/50 max-w-[min(100vw-2rem,320px)]"
              data-testid="style-mini-preview-floating"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Preview · {ratioLabel}</p>
                <button
                  type="button"
                  data-testid="style-mini-preview-floating-close"
                  onClick={() => setFloatingOpen(false)}
                  className="text-[10px] font-medium text-slate-500 hover:text-slate-200"
                >
                  Minimize
                </button>
              </div>
              {previewFrame(width, height)}
            </div>
          )}
        </div>
      )}
    </>
  )
}
