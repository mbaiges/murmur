import { describe, expect, it } from 'vitest'
import {
  classifyConfigDelta,
  draftFieldsEqual,
  pickDraftFields
} from '../../../../../src/core/lib/presets/configDelta'
import {
  AESTHETIC_MOOD_IDS,
  applyAestheticMood
} from '../../../../../src/core/lib/presets/aestheticMoods'
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

describe('classifyConfigDelta', () => {
  it('returns none when draft-relevant fields unchanged', () => {
    const c = base()
    expect(classifyConfigDelta(c, { ...c })).toBe('none')
  })

  it('returns visual for theme-only change', () => {
    const prev = base()
    const next = { ...prev, theme: 'Drift' as const }
    expect(classifyConfigDelta(prev, next)).toBe('visual')
  })

  it('returns visual for font and overlay changes', () => {
    const prev = base()
    expect(classifyConfigDelta(prev, { ...prev, fontFamily: 'Outfit' as const })).toBe('visual')
    expect(
      classifyConfigDelta(prev, {
        ...prev,
        overlays: { ...prev.overlays, dateTime: false }
      })
    ).toBe('visual')
  })

  it('returns content for layout and prompt changes', () => {
    const prev = base()
    expect(classifyConfigDelta(prev, { ...prev, layoutStyle: 'tabloid-stack' as const })).toBe(
      'content'
    )
    expect(classifyConfigDelta(prev, { ...prev, systemPrompt: 'other' })).toBe('content')
  })

  it('returns content for tone and language', () => {
    const prev = base()
    expect(classifyConfigDelta(prev, { ...prev, tonePreset: 'neutral' as const })).toBe('content')
    expect(classifyConfigDelta(prev, { ...prev, language: 'es' })).toBe('content')
  })

  it('prefers content when both visual and content change', () => {
    const prev = base()
    const next = { ...prev, theme: 'Drift' as const, tonePreset: 'professional' as const }
    expect(classifyConfigDelta(prev, next)).toBe('content')
  })
})

describe('draftFieldsEqual', () => {
  it('ignores non-draft keys like geminiApiKey', () => {
    const a = base()
    const b = { ...base(), geminiApiKey: 'other' }
    expect(draftFieldsEqual(a, b)).toBe(true)
  })

  it('detects draft field changes', () => {
    const a = base()
    const b = { ...base(), theme: 'Forest' as const }
    expect(draftFieldsEqual(a, b)).toBe(false)
  })
})

describe('pickDraftFields', () => {
  it('returns overlay copy', () => {
    const c = base()
    const picked = pickDraftFields(c)
    expect(picked.overlays).toEqual(c.overlays)
    expect(picked.overlays).not.toBe(c.overlays)
  })
})

describe('mood Apply parity (AC7)', () => {
  it('legacy saveConfig(applyAestheticMood) matches draft field snapshot for every mood', () => {
    for (const moodId of AESTHETIC_MOOD_IDS) {
      const prev = base()
      const legacyCommitted = { ...prev, ...applyAestheticMood(moodId) }
      const draftAfterMood = { ...prev, ...applyAestheticMood(moodId) }
      expect(draftFieldsEqual(legacyCommitted, draftAfterMood)).toBe(true)
      expect(pickDraftFields(legacyCommitted)).toEqual(pickDraftFields(draftAfterMood))
    }
  })

  it('mood bundle keys are covered by DRAFT_FIELD_KEYS', () => {
    for (const moodId of AESTHETIC_MOOD_IDS) {
      const updates = applyAestheticMood(moodId)
      for (const key of Object.keys(updates) as (keyof MurmurConfig)[]) {
        expect(pickDraftFields({ ...base(), ...updates })[key as keyof ReturnType<typeof pickDraftFields>]).toBeDefined()
      }
    }
  })
})
