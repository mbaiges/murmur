/** Greatest common divisor for aspect ratio labels. */
function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

export function displayAspectRatioLabel(width: number, height: number): string {
  const g = gcd(width, height)
  return `${width / g}:${height / g}`
}

/** Max preview width in CSS pixels; height follows monitor aspect ratio. */
export const STYLE_PREVIEW_MAX_WIDTH_PX = 280

export function stylePreviewDimensions(displayWidth: number, displayHeight: number): {
  width: number
  height: number
  aspectRatio: string
} {
  const w = displayWidth > 0 ? displayWidth : 16
  const h = displayHeight > 0 ? displayHeight : 9
  const width = STYLE_PREVIEW_MAX_WIDTH_PX
  const height = Math.round(width * (h / w))
  return { width, height, aspectRatio: `${w} / ${h}` }
}
