import { describe, expect, it } from 'vitest'
import { wallpaperWindowBounds } from '../../../../src/main/lib/wallpaperDisplayBounds'
import type { Display } from 'electron'

function mockDisplay(partial: Partial<Display>): Display {
  return {
    id: 1,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    scaleFactor: 1,
    rotation: 0,
    internal: false,
    touchSupport: 'unknown',
    size: { width: 1920, height: 1080 },
    ...partial
  } as Display
}

describe('wallpaperWindowBounds', () => {
  it('uses at least work-area span height on Windows', () => {
    const display = mockDisplay({})
    const prev = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })
    try {
      const rect = wallpaperWindowBounds(display)
      expect(rect.height).toBeGreaterThanOrEqual(1080)
      expect(rect.height).toBeGreaterThanOrEqual(display.workArea.height)
    } finally {
      Object.defineProperty(process, 'platform', { value: prev })
    }
  })

  it('returns bounds unchanged on macOS', () => {
    const display = mockDisplay({})
    const prev = process.platform
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    try {
      expect(wallpaperWindowBounds(display)).toEqual(display.bounds)
    } finally {
      Object.defineProperty(process, 'platform', { value: prev })
    }
  })
})
