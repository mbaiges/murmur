/** Phrase-length shrink factor for wallpaper / preview font clamps. */
export function phraseLengthFontScale(phraseLength: number): number {
  if (phraseLength > 220) return 0.55
  if (phraseLength > 130) return 0.7
  if (phraseLength > 75) return 0.85
  return 1
}

/**
 * Font size clamp matching WallpaperView.
 * When `layoutWidthPx` is set (scaled Style preview canvas), the vw leg is resolved
 * against that width in px so it matches the real display instead of the settings window.
 */
export function wallpaperFontClamp(
  minRem: number,
  vw: number,
  maxRem: number,
  phraseLength: number,
  layoutWidthPx?: number
): string {
  const scale = phraseLengthFontScale(phraseLength)
  const min = Number((minRem * scale).toFixed(2))
  const mid = Number((vw * scale).toFixed(2))
  const max = Number((maxRem * scale).toFixed(2))

  if (layoutWidthPx && layoutWidthPx > 0) {
    const minPx = Number((min * 16).toFixed(2))
    const midPx = Number(((layoutWidthPx * mid) / 100).toFixed(2))
    const maxPx = Number((max * 16).toFixed(2))
    return `clamp(${minPx}px, ${midPx}px, ${maxPx}px)`
  }

  return `clamp(${min}rem, ${mid}vw, ${max}rem)`
}
