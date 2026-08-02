import {
  ABSURD_PROVERB_PROMPT,
  BEST_NEWS_TITLE_PROMPT,
  CYBERPUNK_TERMINAL_PROMPT,
  EXISTENTIAL_DREAD_PROMPT,
  GOTHIC_PURPLE_PROSE_PROMPT,
  PARANOID_CONSPIRACY_PROMPT,
  REAL_BEST_NEWS_PROMPT,
  REAL_WORST_NEWS_PROMPT,
  WORST_NEWS_TITLE_PROMPT,
  ZEN_KOAN_PROMPT
} from '../../domain/types'

export type PromptPresetId =
  | 'Absurd Proverb'
  | 'Worst News Title'
  | 'Best News Title'
  | 'Real Best News'
  | 'Real Worst News'
  | 'Cyberpunk Terminal'
  | 'Zen Koan'
  | 'Paranoid Conspiracy'
  | 'Existential Dread'
  | 'Gothic Purple Prose'
  | 'Custom'

export interface PromptPresetDefinition {
  id: Exclude<PromptPresetId, 'Custom'>
  label: string
  description: string
  prompt: string
  /** Aesthetic mood that applies this prompt when activated */
  moodName?: string
}

/** Prompts wired to Aesthetic Moods (full atmosphere presets). */
export const MOOD_LINKED_PROMPT_PRESETS: PromptPresetDefinition[] = [
  {
    id: 'Cyberpunk Terminal',
    label: 'Cyberpunk Terminal',
    description: 'Rogue Terminal mood',
    prompt: CYBERPUNK_TERMINAL_PROMPT,
    moodName: 'Rogue Terminal'
  },
  {
    id: 'Zen Koan',
    label: 'Zen Koan',
    description: 'Zen Study mood',
    prompt: ZEN_KOAN_PROMPT,
    moodName: 'Zen Study'
  },
  {
    id: 'Gothic Purple Prose',
    label: 'Gothic Purple Prose',
    description: 'Gothic Novelist mood',
    prompt: GOTHIC_PURPLE_PROSE_PROMPT,
    moodName: 'Gothic Novelist'
  },
  {
    id: 'Worst News Title',
    label: 'Worst News Title',
    description: 'Clickbait Press mood',
    prompt: WORST_NEWS_TITLE_PROMPT,
    moodName: 'Clickbait Press'
  }
]

/** Prompt-only presets (change AI voice without switching the full mood). */
export const STANDALONE_PROMPT_PRESETS: PromptPresetDefinition[] = [
  {
    id: 'Absurd Proverb',
    label: 'Absurd Proverb (Default)',
    description: 'Surreal proverb cadence',
    prompt: ABSURD_PROVERB_PROMPT
  },
  {
    id: 'Best News Title',
    label: 'Best News Title',
    description: 'Uplifting headline voice',
    prompt: BEST_NEWS_TITLE_PROMPT
  },
  {
    id: 'Real Best News',
    label: 'Real Best News',
    description: 'Pick the best headline from the feed (verbatim, no remix)',
    prompt: REAL_BEST_NEWS_PROMPT
  },
  {
    id: 'Real Worst News',
    label: 'Real Worst News',
    description: 'Pick the worst headline from the feed (verbatim, no remix)',
    prompt: REAL_WORST_NEWS_PROMPT
  },
  {
    id: 'Paranoid Conspiracy',
    label: 'Paranoid Conspiracy',
    description: 'Conspiratorial bulletin tone',
    prompt: PARANOID_CONSPIRACY_PROMPT
  },
  {
    id: 'Existential Dread',
    label: 'Existential Dread',
    description: 'Melancholic machine voice',
    prompt: EXISTENTIAL_DREAD_PROMPT
  }
]

const ALL_PRESETS = [...MOOD_LINKED_PROMPT_PRESETS, ...STANDALONE_PROMPT_PRESETS]

export function promptToPresetId(systemPrompt: string): PromptPresetId {
  const match = ALL_PRESETS.find((p) => p.prompt === systemPrompt)
  return match?.id ?? 'Custom'
}

export function presetIdToPrompt(presetId: string): string | null {
  const match = ALL_PRESETS.find((p) => p.id === presetId)
  return match?.prompt ?? null
}
