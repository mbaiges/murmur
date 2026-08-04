import { describe, expect, it } from 'vitest'
import { resolveBackgroundPaintInput } from '../../../../../src/core/lib/background/resolveBackgroundBase'
import { resolveMonitorBackgroundPaint } from '../../../../../src/core/lib/background/resolveMonitorBackgroundPaint'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'
import type { IBackgroundAssetStore } from '../../../../../src/core/ports/IBackgroundAssetStore'

describe('resolveBackgroundPaintInput', () => {
  const base = getDefaultMonitorProfile()

  it('returns gradient when mode is gradient', () => {
    const result = resolveBackgroundPaintInput(
      { ...base, backgroundMode: 'gradient', theme: 'Midnight' },
      { personal: '/tmp/p.png', ai: '/tmp/a.jpg' }
    )
    expect(result).toEqual({ backgroundMode: 'gradient', theme: 'Midnight' })
  })

  it('uses personal path when mode is photo and file exists', () => {
    const result = resolveBackgroundPaintInput(
      { ...base, backgroundMode: 'photo', theme: 'Drift' },
      { personal: '/abs/personal.jpg' }
    )
    expect(result).toEqual({
      backgroundMode: 'photo',
      theme: 'Drift',
      baseImagePath: '/abs/personal.jpg'
    })
  })

  it('falls back to gradient when photo mode but path missing', () => {
    const result = resolveBackgroundPaintInput(
      { ...base, backgroundMode: 'photo' },
      { personal: null }
    )
    expect(result.backgroundMode).toBe('gradient')
    expect(result.baseImagePath).toBeUndefined()
  })

  it('uses ai path when mode is ai', () => {
    const result = resolveBackgroundPaintInput(
      { ...base, backgroundMode: 'ai' },
      { ai: '/abs/ai-latest.jpg' }
    )
    expect(result).toEqual({
      backgroundMode: 'ai',
      theme: base.theme,
      baseImagePath: '/abs/ai-latest.jpg'
    })
  })
})

describe('resolveMonitorBackgroundPaint', () => {
  it('delegates to asset store paths', () => {
    const profile = getDefaultMonitorProfile({
      backgroundMode: 'photo',
      backgroundPhotoRelPath: 'mon-a/personal.png'
    })
    const store: IBackgroundAssetStore = {
      importPersonalPhoto: async () => '',
      saveGeneratedImage: async () => '',
      resolveAbsolutePath: (rel) => {
        if (rel === 'mon-a/personal.png') return '/data/mon-a/personal.png'
        if (rel === 'mon-a/ai-latest.png') return '/data/mon-a/ai-latest.png'
        return null
      },
      latestAiRelPath: () => 'mon-a/ai-latest.png'
    }
    const photo = resolveMonitorBackgroundPaint(profile, 'mon-a', store)
    expect(photo.baseImagePath).toBe('/data/mon-a/personal.png')
    expect(photo.backgroundMode).toBe('photo')

    const aiProfile = getDefaultMonitorProfile({ backgroundMode: 'ai' })
    const ai = resolveMonitorBackgroundPaint(aiProfile, 'mon-a', store)
    expect(ai.baseImagePath).toBe('/data/mon-a/ai-latest.png')
    expect(ai.backgroundMode).toBe('ai')
  })
})
