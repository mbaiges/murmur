import { describe, expect, it } from 'vitest'
import {
  previewPhraseLengthScale,
  previewScaleForFrame
} from '../../../../../src/renderer/features/wallpaper/wallpaperPreviewScale'

describe('wallpaperPreviewScale', () => {
  it('scales frame width against display width', () => {
    expect(previewScaleForFrame(280, 1920)).toBeCloseTo(280 / 1920, 5)
    expect(previewScaleForFrame(88, 1920)).toBeCloseTo(88 / 1920, 5)
  })

  it('shrinks long phrases', () => {
    expect(previewPhraseLengthScale(50)).toBe(1)
    expect(previewPhraseLengthScale(100)).toBe(0.85)
    expect(previewPhraseLengthScale(150)).toBe(0.7)
    expect(previewPhraseLengthScale(250)).toBe(0.55)
  })
})
