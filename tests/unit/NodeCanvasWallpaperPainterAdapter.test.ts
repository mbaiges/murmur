import { describe, it, expect } from 'vitest'
import { NodeCanvasWallpaperPainterAdapter } from '../../src/adapters/canvas/NodeCanvasWallpaperPainterAdapter'
import { ThemeName } from '../../src/domain/types'

describe('NodeCanvasWallpaperPainterAdapter', () => {
  const painter = new NodeCanvasWallpaperPainterAdapter()
  const themes: ThemeName[] = ['Midnight', 'Drift', 'Parchment', 'Blanc', 'Static']

  themes.forEach((theme) => {
    it(`paints wallpaper successfully for theme: ${theme}`, async () => {
      const buffer = await painter.paint({
        phrase: 'the interest rate of clouds fluctuations geopolitical coffee',
        theme,
        fontFamily: 'Outfit',
        animation: 'Fade',
        overlays: { dateTime: true, sourceCredit: true, inspiringHeadlines: true },
        resolution: { width: 800, height: 600 },
        headlines: ['Headline 1', 'Headline 2'],
        sources: ['Source A']
      })

      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer[0]).toBe(0x89)
    })
  })
})
