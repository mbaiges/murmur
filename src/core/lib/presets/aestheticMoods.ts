import type { MurmurConfig, TonePreset } from '../../domain/types'
import {
  CYBERPUNK_TERMINAL_PROMPT,
  GOTHIC_PURPLE_PROSE_PROMPT,
  WORST_NEWS_TITLE_PROMPT,
  ZEN_KOAN_PROMPT
} from '../../domain/prompts'

export type AestheticMoodId = 'Rogue Terminal' | 'Zen Study' | 'Gothic Novelist' | 'Clickbait Press'

export const AESTHETIC_MOOD_IDS: AestheticMoodId[] = [
  'Rogue Terminal',
  'Zen Study',
  'Gothic Novelist',
  'Clickbait Press'
]

export function defaultToneForMood(_moodId: AestheticMoodId): TonePreset {
  return 'none'
}

export function applyAestheticMood(moodId: AestheticMoodId): Partial<MurmurConfig> {
  const tonePreset = defaultToneForMood(moodId)
  switch (moodId) {
    case 'Rogue Terminal':
      return {
        tonePreset,
        systemPrompt: CYBERPUNK_TERMINAL_PROMPT,
        theme: 'Cyberpunk',
        fontFamily: 'Monospace',
        layoutStyle: 'editorial-left',
        animation: 'Typewriter',
        audioFeedback: true,
        vignetteStyle: 'dramatic',
        noiseIntensity: 'heavy',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: false,
        enableNewlines: true
      }
    case 'Zen Study':
      return {
        tonePreset,
        systemPrompt: ZEN_KOAN_PROMPT,
        theme: 'Parchment',
        fontFamily: 'EB Garamond',
        layoutStyle: 'book-cover',
        animation: 'Fade',
        audioFeedback: false,
        vignetteStyle: 'soft',
        noiseIntensity: 'subtle',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: false,
        enableNewlines: true
      }
    case 'Gothic Novelist':
      return {
        tonePreset,
        systemPrompt: GOTHIC_PURPLE_PROSE_PROMPT,
        theme: 'Drift',
        fontFamily: 'Playfair Display',
        layoutStyle: 'asymmetrical',
        animation: 'DriftIn',
        audioFeedback: false,
        vignetteStyle: 'dramatic',
        noiseIntensity: 'subtle',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: false,
        enableNewlines: true
      }
    case 'Clickbait Press':
      return {
        tonePreset,
        systemPrompt: WORST_NEWS_TITLE_PROMPT,
        theme: 'Crimson',
        fontFamily: 'Outfit',
        layoutStyle: 'centered',
        animation: 'Fade',
        audioFeedback: false,
        vignetteStyle: 'none',
        noiseIntensity: 'none',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: false,
        enableNewlines: true
      }
  }
}

export function isAestheticMoodActive(config: MurmurConfig, moodId: AestheticMoodId): boolean {
  const expected = applyAestheticMood(moodId)
  return (Object.keys(expected) as (keyof MurmurConfig)[]).every((key) => {
    if (key === 'tonePreset') return config.tonePreset === expected.tonePreset
    return config[key] === expected[key]
  })
}
