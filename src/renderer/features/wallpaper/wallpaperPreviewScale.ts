/** Scale mini preview so `vw` and layout match primary display proportions. */
export function previewScaleForFrame(frameWidthPx: number, displayWidthPx: number): number {
  const ref = displayWidthPx > 0 ? displayWidthPx : 1920
  return frameWidthPx / ref
}

/** Phrase-length shrink factor (aligned with WallpaperView getScaledFontClamp). */
export function previewPhraseLengthScale(phraseLength: number): number {
  if (phraseLength > 220) return 0.55
  if (phraseLength > 130) return 0.7
  if (phraseLength > 75) return 0.85
  return 1
}

/** Centered-layout phrase size on full display (vw leg of clamp). */
export function previewPhraseFontSizeVw(phraseLength: number): string {
  const lengthScale = previewPhraseLengthScale(phraseLength)
  const minRem = 1.8 * lengthScale
  const vw = 4.2 * lengthScale
  const maxRem = 3.6 * lengthScale
  return `clamp(${minRem.toFixed(2)}rem, ${vw.toFixed(2)}vw, ${maxRem.toFixed(2)}rem)`
}
