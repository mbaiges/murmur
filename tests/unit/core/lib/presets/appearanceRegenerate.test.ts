import { describe, expect, it } from 'vitest'
import { shouldRegeneratePhraseAfterAppearanceChange } from '../../../../../src/core/lib/presets/appearanceRegenerate'
import type { MurmurConfig } from '../../../../../src/core/domain/types'

const base = (): MurmurConfig =>
  ({
    geminiApiKey: 'k',
    feeds: ['https://example.com/rss'],
    refreshIntervalMinutes: 60,
    language: 'auto',
    theme: 'Midnight',
    animation: 'Fade',
    overlays: { dateTime: true, sourceCredit: false, inspiringHeadlines: false },
    headlineSampleSize: 15,
    launchAtLogin: false,
    fontFamily: 'EB Garamond',
    monitors: [],
    textAlignment: 'center',
    layoutStyle: 'centered',
    vignetteStyle: 'none',
    audioFeedback: true,
    systemPrompt: 'prompt',
    enableBold: true,
    enableItalic: true,
    enableNewlines: true,
    enableDifferentFonts: true,
    noiseIntensity: 'none',
    tonePreset: 'none',
    customToneText: ''
  }) as MurmurConfig

describe('shouldRegeneratePhraseAfterAppearanceChange tone', () => {
  it('regenerates when tonePreset changes', () => {
    const prev = base()
    const next = { ...prev, tonePreset: 'neutral' as const }
    expect(shouldRegeneratePhraseAfterAppearanceChange(prev, next)).toBe(true)
  })

  it('regenerates when customToneText changes', () => {
    const prev = { ...base(), tonePreset: 'custom' as const, customToneText: 'a' }
    const next = { ...prev, customToneText: 'b' }
    expect(shouldRegeneratePhraseAfterAppearanceChange(prev, next)).toBe(true)
  })
})
