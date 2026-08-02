import { describe, expect, it } from 'vitest'
import { previewPhraseLengthScale, previewScaleForFrame } from '../../../../../src/renderer/features/wallpaper/wallpaperPreviewScale'
import { phraseLengthFontScale, wallpaperFontClamp } from '../../../../../src/renderer/features/wallpaper/wallpaperFontSize'

describe('wallpaperPreviewScale', () => {
  it('scales frame width against display width', () => {
    expect(previewScaleForFrame(280, 1920)).toBeCloseTo(280 / 1920, 5)
    expect(previewScaleForFrame(88, 1920)).toBeCloseTo(88 / 1920, 5)
  })

  it('re-exports phrase length scale', () => {
    expect(previewPhraseLengthScale(50)).toBe(phraseLengthFontScale(50))
    expect(previewPhraseLengthScale(100)).toBe(0.85)
    expect(previewPhraseLengthScale(150)).toBe(0.7)
    expect(previewPhraseLengthScale(250)).toBe(0.55)
  })
})

describe('wallpaperFontClamp', () => {
  it('uses vw clamp on the real display', () => {
    expect(wallpaperFontClamp(1.6, 3.6, 3.2, 40)).toBe('clamp(1.6rem, 3.6vw, 3.2rem)')
    expect(wallpaperFontClamp(1.6, 3.6, 3.2, 100)).toBe('clamp(1.36rem, 3.06vw, 2.72rem)')
  })

  it('resolves vw against layout width in px mode', () => {
    // mid = 3.6vw of 1920 = 69.12px; min/max from rem*16
    expect(wallpaperFontClamp(1.6, 3.6, 3.2, 40, 1920)).toBe('clamp(25.6px, 69.12px, 51.2px)')
    expect(wallpaperFontClamp(1.6, 3.6, 3.2, 100, 1920)).toBe('clamp(21.76px, 58.75px, 43.52px)')
  })
})
