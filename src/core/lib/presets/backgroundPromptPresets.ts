import type { AestheticMoodId } from './aestheticMoods'
import type { MonitorProfile } from '../../domain/types'

export type BackgroundPresetId =
  | 'Abstract mood'
  | 'Editorial paper'
  | 'Warm film grain'
  | 'Absurd connections'
  | 'Peppa pig episode'
  | 'Cyberpunk neon haze'
  | 'Zen mist'
  | 'Gothic violet fog'
  | 'Tabloid flash'
  | 'Custom'

export type BackgroundTemplateVariable = 'samples' | 'phrase'

/** Appended to every preset/custom template so FLUX never bakes in phrase typography. */
export const BACKGROUND_NO_TEXT_CLAUSE =
  'Absolutely no text, letters, numbers, words, captions, typography, logos, or watermarks in the image — Murmur renders phrase text separately on top.'

export function ensureBackgroundNoTextClause(template: string): string {
  const t = template.trim()
  const lower = t.toLowerCase()
  if (
    lower.includes('no text') &&
    lower.includes('no logo') &&
    (lower.includes('no watermark') || lower.includes('no watermarks'))
  ) {
    return t
  }
  return `${t} ${BACKGROUND_NO_TEXT_CLAUSE}`
}

export interface BackgroundPresetDefinition {
  id: Exclude<BackgroundPresetId, 'Custom'>
  label: string
  description: string
  /** Preset prompt template; may include `{{samples}}` and/or `{{phrase}}`. */
  template: string
  /** Which context variables are sent for this preset (substituted into template). */
  variables: BackgroundTemplateVariable[]
  moodName?: AestheticMoodId
}

export const MOOD_LINKED_BACKGROUND_PRESETS: BackgroundPresetDefinition[] = [
  {
    id: 'Cyberpunk neon haze',
    label: 'Cyberpunk neon haze',
    description: 'Rogue Terminal mood',
    moodName: 'Rogue Terminal',
    variables: ['samples'],
    template:
      'Abstract desktop wallpaper, neon city fog, dark magenta and teal, cinematic. Headline mood: {{samples}}. No text, no logos, no faces.'
  },
  {
    id: 'Zen mist',
    label: 'Zen mist',
    description: 'Zen Study mood',
    moodName: 'Zen Study',
    variables: [],
    template:
      'Soft minimal wallpaper, paper-like mist, muted greens and warm gray, calm, no text, no logos.'
  },
  {
    id: 'Gothic violet fog',
    label: 'Gothic violet fog',
    description: 'Gothic Novelist mood',
    moodName: 'Gothic Novelist',
    variables: ['phrase'],
    template:
      'Dark romantic atmosphere, violet and ink-black fog, painterly. Emotional tone from on-screen phrase (no readable text): {{phrase}}.'
  },
  {
    id: 'Tabloid flash',
    label: 'Tabloid flash',
    description: 'Clickbait Press mood',
    moodName: 'Clickbait Press',
    variables: ['samples', 'phrase'],
    template:
      'High-contrast newsprint texture and flash photography feel, abstract energy from headlines: {{samples}}. Satirical tension from phrase mood (never render words): {{phrase}}. No readable headlines or text.'
  }
]

export const STANDALONE_BACKGROUND_PRESETS: BackgroundPresetDefinition[] = [
  {
    id: 'Abstract mood',
    label: 'Abstract mood (Default)',
    description: 'Headline- and phrase-informed color and mood',
    variables: ['samples', 'phrase'],
    template:
      'Abstract wallpaper for a desktop. Let headline themes {{samples}} and the on-screen phrase mood {{phrase}} subtly influence color and metaphor (do not quote verbatim). Soft gradients, no text, no logos, suitable behind typography.'
  },
  {
    id: 'Editorial paper',
    label: 'Editorial paper',
    description: 'Magazine paper texture',
    variables: [],
    template: 'Subtle editorial paper texture, neutral tones, minimal, no text.'
  },
  {
    id: 'Warm film grain',
    label: 'Warm film grain',
    description: 'Analog warmth from headline mood',
    variables: ['samples'],
    template:
      'Warm analog film grain, soft bokeh lights, cozy. Headline mood: {{samples}}. No text.'
  },
  {
    id: 'Absurd connections',
    label: 'Absurd connections',
    description: 'Main concepts from the phrase, linked in surreal absurd visuals',
    variables: ['phrase', 'samples'],
    template:
      'Read the on-screen phrase and extract its main concepts (people, places, objects, actions, institutions, emotions). Design a desktop wallpaper that connects those concepts in an absurd, surreal, dream-logic way — unexpected juxtapositions, wrong scale, silly metaphors, visual puns. Let headline mood optionally add tension: {{samples}}. Phrase to mine for concepts (never render as readable text): {{phrase}}. Purely visual scene, no text, no logos, no watermarks.'
  },
  {
    id: 'Peppa pig episode',
    label: 'Peppa pig episode',
    description: 'Cartoon Peppa Pig scene themed by headlines and phrase mood',
    variables: ['samples', 'phrase'],
    template:
      'Cartoony wallpaper for a desktop. Let headline themes {{samples}} and the on-screen phrase mood {{phrase}} subtly influence the scene and metaphor (do not quote verbatim). Image of a peppa pig, influenced by the given phrase. Peppa pig on an episode of the phrase, no quotes, no text.'
  }
]

export const ALL_BACKGROUND_PRESETS: BackgroundPresetDefinition[] = [
  ...STANDALONE_BACKGROUND_PRESETS,
  ...MOOD_LINKED_BACKGROUND_PRESETS
]

export function getBackgroundPresetById(id: string): BackgroundPresetDefinition | undefined {
  return ALL_BACKGROUND_PRESETS.find((p) => p.id === id)
}

export function backgroundPresetIdFromProfile(profile: MonitorProfile): BackgroundPresetId {
  if (profile.backgroundPresetId === 'Custom') return 'Custom'
  return getBackgroundPresetById(profile.backgroundPresetId)?.id ?? 'Abstract mood'
}

export function resolveBackgroundTemplateSource(profile: MonitorProfile): string {
  if (profile.backgroundPresetId === 'Custom') {
    return profile.customBackgroundPrompt.trim()
  }
  const preset = getBackgroundPresetById(profile.backgroundPresetId)
  return preset?.template ?? STANDALONE_BACKGROUND_PRESETS[0].template
}

/** Which variables to substitute for this profile (custom: any placeholders present in text). */
export function resolveBackgroundTemplateVariables(profile: MonitorProfile): BackgroundTemplateVariable[] {
  if (profile.backgroundPresetId === 'Custom') {
    const t = profile.customBackgroundPrompt
    const vars: BackgroundTemplateVariable[] = []
    if (t.includes('{{samples}}')) vars.push('samples')
    if (t.includes('{{phrase}}')) vars.push('phrase')
    return vars
  }
  const preset = getBackgroundPresetById(profile.backgroundPresetId)
  return preset?.variables ?? STANDALONE_BACKGROUND_PRESETS[0].variables
}

export function formatSamplesBlock(sampleTitles: string[]): string {
  if (sampleTitles.length === 0) return '(No headlines this refresh.)'
  return sampleTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')
}

export function applyBackgroundTemplate(
  template: string,
  variables: BackgroundTemplateVariable[],
  context: { sampleTitles: string[]; phrase: string }
): string {
  let out = template
  if (variables.includes('samples')) {
    out = out.replaceAll('{{samples}}', formatSamplesBlock(context.sampleTitles))
  } else {
    out = out.replaceAll('{{samples}}', '')
  }
  if (variables.includes('phrase')) {
    const phrase = context.phrase.trim() || '(No phrase yet.)'
    out = out.replaceAll('{{phrase}}', phrase)
  } else {
    out = out.replaceAll('{{phrase}}', '')
  }
  return out.replace(/\n{3,}/g, '\n\n').trim()
}

/** @deprecated use resolveBackgroundTemplateSource + applyBackgroundTemplate */
export function resolveBackgroundInstructions(profile: MonitorProfile): string {
  return applyBackgroundTemplate(
    resolveBackgroundTemplateSource(profile),
    resolveBackgroundTemplateVariables(profile),
    { sampleTitles: [], phrase: '' }
  )
}
