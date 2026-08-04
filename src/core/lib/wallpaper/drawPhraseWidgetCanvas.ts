import { phraseToPlainText } from '../phrase/phrasePlainText'
import type { OverlayConfig } from '../../domain/types'

export function measurePhraseWidgetFontSize(
  ctx: CanvasRenderingContext2D,
  plain: string,
  maxWidth: number,
  maxHeight: number,
  minFont = 8,
  startFont = 14
): { fontSize: number; lines: string[] } {
  let fontSize = startFont
  while (fontSize >= minFont) {
    ctx.font = `italic ${fontSize}px "Outfit", sans-serif`
    const lines = wrapText(ctx, plain, maxWidth)
    const lineHeight = fontSize * 1.35
    const totalHeight = lines.length * lineHeight
    if (totalHeight <= maxHeight) {
      return { fontSize, lines }
    }
    fontSize -= 1
  }
  ctx.font = `italic ${minFont}px "Outfit", sans-serif`
  return { fontSize: minFont, lines: wrapText(ctx, plain, maxWidth) }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let line = words[0]!
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`
    if (ctx.measureText(next).width <= maxWidth) {
      line = next
    } else {
      lines.push(line)
      line = words[i]!
    }
  }
  lines.push(line)
  return lines
}

export function phraseWidgetLayoutMetrics(
  width: number,
  height: number,
  overlays: OverlayConfig
): { leftReserve: number; rightReserve: number; centerWidth: number; centerX: number; bottomY: number } {
  const padY = height * 0.05
  const leftReserve = overlays.inspiringHeadlines ? width * 0.24 : width * 0.06
  const rightReserve = overlays.sourceCredit ? width * 0.24 : width * 0.06
  const centerWidth = Math.max(width * 0.2, width - leftReserve - rightReserve)
  const centerX = leftReserve + centerWidth / 2
  return { leftReserve, rightReserve, centerWidth, centerX, bottomY: height - padY }
}

export function plainPhraseForWidget(phrase: string): string {
  return phraseToPlainText(phrase).trim()
}
