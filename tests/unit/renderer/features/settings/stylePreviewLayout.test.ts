import { describe, expect, it } from 'vitest'
import {
  displayAspectRatioLabel,
  stylePreviewDimensions
} from '../../../../../src/renderer/features/settings/lib/stylePreviewLayout'

describe('stylePreviewLayout', () => {
  it('labels 1920x1080 as 16:9', () => {
    expect(displayAspectRatioLabel(1920, 1080)).toBe('16:9')
  })

  it('labels 800x600 as 4:3', () => {
    expect(displayAspectRatioLabel(800, 600)).toBe('4:3')
  })

  it('preserves aspect ratio in preview dimensions', () => {
    const { width, height } = stylePreviewDimensions(1920, 1080)
    expect(width / height).toBeCloseTo(16 / 9, 1)
  })
})
