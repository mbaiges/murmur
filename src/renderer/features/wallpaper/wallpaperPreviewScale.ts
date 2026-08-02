import { phraseLengthFontScale } from './wallpaperFontSize'

/** Scale mini preview so `vw` and layout match primary display proportions. */
export function previewScaleForFrame(frameWidthPx: number, displayWidthPx: number): number {
  const ref = displayWidthPx > 0 ? displayWidthPx : 1920
  return frameWidthPx / ref
}

/** @deprecated Prefer phraseLengthFontScale from wallpaperFontSize */
export const previewPhraseLengthScale = phraseLengthFontScale
