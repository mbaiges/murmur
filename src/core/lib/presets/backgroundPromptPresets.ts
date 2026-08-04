import type { AestheticMoodId } from './aestheticMoods'
import type { MonitorProfile } from '../../domain/types'

export type BackgroundPresetId =
  | 'Abstract mood'
  | 'Editorial paper'
  | 'Warm film grain'
  | 'Cyberpunk neon haze'
  | 'Zen mist'
  | 'Gothic violet fog'
  | 'Tabloid flash'
  | 'Custom'

export interface BackgroundPresetDefinition {
  id: Exclude<BackgroundPresetId, 'Custom'>
  label: string
  description: string
  instructions: string
  moodName?: AestheticMoodId
}

export const MOOD_LINKED_BACKGROUND_PRESETS: BackgroundPresetDefinition[] = [
  {
    id: 'Cyberpunk neon haze',
    label: 'Cyberpunk neon haze',
    description: 'Rogue Terminal mood',
    moodName: 'Rogue Terminal',
    instructions:
      'Abstract desktop wallpaper, neon city fog, dark magenta and teal, cinematic, no text, no logos, no faces.'
  },
  {
    id: 'Zen mist',
    label: 'Zen mist',
    description: 'Zen Study mood',
    moodName: 'Zen Study',
    instructions:
      'Soft minimal wallpaper, paper-like mist, muted greens and warm gray, calm, no text, no logos.'
  },
  {
    id: 'Gothic violet fog',
    label: 'Gothic violet fog',
    description: 'Gothic Novelist mood',
    moodName: 'Gothic Novelist',
    instructions:
      'Dark romantic atmosphere, violet and ink-black fog, painterly, no text, no readable words.'
  },
  {
    id: 'Tabloid flash',
    label: 'Tabloid flash',
    description: 'Clickbait Press mood',
    moodName: 'Clickbait Press',
    instructions:
      'High-contrast newsprint texture and flash photography feel, abstract, no readable headlines or text.'
  }
]

export const STANDALONE_BACKGROUND_PRESETS: BackgroundPresetDefinition[] = [
  {
    id: 'Abstract mood',
    label: 'Abstract mood (Default)',
    description: 'Headline-inspired color and mood',
    instructions:
      'Abstract wallpaper inspired by the themes of the news headlines, soft gradients, no text, no logos, suitable behind typography.'
  },
  {
    id: 'Editorial paper',
    label: 'Editorial paper',
    description: 'Magazine paper texture',
    instructions: 'Subtle editorial paper texture, neutral tones, minimal, no text.'
  },
  {
    id: 'Warm film grain',
    label: 'Warm film grain',
    description: 'Analog warmth',
    instructions: 'Warm analog film grain, soft bokeh lights, cozy, no text.'
  }
]

export function getBackgroundPresetById(id: string): BackgroundPresetDefinition | undefined {
  return [...MOOD_LINKED_BACKGROUND_PRESETS, ...STANDALONE_BACKGROUND_PRESETS].find((p) => p.id === id)
}

export function resolveBackgroundInstructions(profile: MonitorProfile): string {
  if (profile.backgroundPresetId === 'Custom') {
    return profile.customBackgroundPrompt.trim()
  }
  const preset = getBackgroundPresetById(profile.backgroundPresetId)
  return preset?.instructions ?? STANDALONE_BACKGROUND_PRESETS[0].instructions
}
