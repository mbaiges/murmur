import { describe, it, expect } from 'vitest'
import { NodeCanvasWallpaperPainterAdapter } from '../../../../../src/main/infrastructure/canvas/NodeCanvasWallpaperPainterAdapter'
import { ThemeName } from '../../../../../src/core/domain/types'
import { DEFAULT_PHRASE_FORMAT_FLAGS } from '../../../../../src/core/lib/phrase/phraseFormatFlags'

const basePaintOptions = {
  fontFamily: 'Outfit',
  animation: 'Fade' as const,
  overlays: { dateTime: true, sourceCredit: true, inspiringHeadlines: true },
  resolution: { width: 800, height: 600 },
  textAlignment: 'center' as const,
  layoutStyle: 'centered' as const,
  vignetteStyle: 'none' as const,
  noiseIntensity: 'none' as const,
  audioFeedback: false,
  ...DEFAULT_PHRASE_FORMAT_FLAGS
}

describe('NodeCanvasWallpaperPainterAdapter', () => {
  const painter = new NodeCanvasWallpaperPainterAdapter()
  const themes: ThemeName[] = ['Midnight', 'Drift', 'Parchment', 'Blanc', 'Static']

  themes.forEach((theme) => {
    it(`paints wallpaper successfully for theme: ${theme}`, async () => {
      const buffer = await painter.paint({
        phrase: 'the interest rate of clouds fluctuations geopolitical coffee',
        theme,
        headlines: ['Headline 1', 'Headline 2'],
        sources: ['Source A'],
        ...basePaintOptions
      })

      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer[0]).toBe(0x89)
    })
  })
})
