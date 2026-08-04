import type { MonitorProfile } from '../../domain/types'

export type AiPhraseInImagePreset =
  | 'word-art'
  | 'poem'
  | 'book-quote'
  | 'match-prompt-tone'
  | 'neon-sign'
  | 'newspaper-headline'
  | 'graffiti-tag'
  | 'minimalist-caption'
  | 'cinematic-subtitle'

export const AI_PHRASE_IN_IMAGE_PRESETS: {
  value: AiPhraseInImagePreset
  label: string
  description: string
}[] = [
  {
    value: 'word-art',
    label: 'Word Art',
    description: 'Bold decorative typography integrated into the scene'
  },
  {
    value: 'poem',
    label: 'Poem',
    description: 'Literary line breaks; phrase rendered as a short poem'
  },
  {
    value: 'book-quote',
    label: 'Book Quote',
    description: 'Epigraph or book-jacket quotation styling'
  },
  {
    value: 'match-prompt-tone',
    label: 'Match Prompt + Tone',
    description: 'Phrase look follows your Voice system prompt and tone'
  },
  {
    value: 'neon-sign',
    label: 'Neon Sign',
    description: 'Glowing tube-neon or sign lettering on a dark scene'
  },
  {
    value: 'newspaper-headline',
    label: 'News Headline',
    description: 'Bold tabloid or broadsheet headline column, print texture'
  },
  {
    value: 'graffiti-tag',
    label: 'Graffiti',
    description: 'Spray-paint or street-art lettering on a wall surface'
  },
  {
    value: 'minimalist-caption',
    label: 'Minimal Caption',
    description: 'Small clean sans-serif caption anchored in negative space'
  },
  {
    value: 'cinematic-subtitle',
    label: 'Film Subtitle',
    description: 'Lower-third cinematic subtitle bar with readable phrase'
  }
]

export type AiPhraseDeliveryMode = 'overlay' | 'in-image' | 'hidden'

export function getAiPhraseDeliveryMode(profile: MonitorProfile): AiPhraseDeliveryMode {
  if (profile.backgroundMode !== 'ai') {
    return profile.showHeroPhrase ? 'overlay' : 'hidden'
  }
  if (profile.aiPhraseInImage) return 'in-image'
  if (profile.showHeroPhrase === false) return 'hidden'
  return 'overlay'
}

export function patchForAiPhraseDeliveryMode(mode: AiPhraseDeliveryMode): Partial<MonitorProfile> {
  switch (mode) {
    case 'in-image':
      return { aiPhraseInImage: true, showHeroPhrase: true }
    case 'hidden':
      return { aiPhraseInImage: false, showHeroPhrase: false }
    case 'overlay':
      return { aiPhraseInImage: false, showHeroPhrase: true }
  }
}

export function isAiPhraseIntegrated(profile: MonitorProfile): boolean {
  return profile.backgroundMode === 'ai' && profile.aiPhraseInImage
}

/** When true, Murmur draws phrase/layout in canvas and overlay; when false, phrase belongs in the FLUX image only or is hidden. */
export function shouldPaintPhraseOverlay(profile: MonitorProfile): boolean {
  if (profile.showHeroPhrase === false) return false
  return !isAiPhraseIntegrated(profile)
}

export function shouldShowPhraseWidget(profile: MonitorProfile): boolean {
  return profile.overlays.phraseWidget === true
}

export function aiPhraseInImagePresetInstruction(
  preset: AiPhraseInImagePreset,
  phraseText: string,
  voiceContext?: { systemPrompt: string; toneInstruction: string | null }
): string {
  const quoted = phraseText.trim() || '(no phrase yet)'
  const verbatimLead =
    'Render the ENTIRE phrase below verbatim in the image (every word; long phrases may wrap across multiple lines; never omit the rest of the sentence):\n'
  switch (preset) {
    case 'word-art':
      return `${verbatimLead}${quoted}`
    case 'poem':
      return `${verbatimLead}Poem typography with line breaks; still include every word:\n${quoted}`
    case 'book-quote':
      return `${verbatimLead}Book quote / epigraph styling:\n${quoted}`
    case 'match-prompt-tone': {
      const voice = voiceContext?.systemPrompt?.trim() || '(default voice)'
      const tone = voiceContext?.toneInstruction?.trim() || '(neutral tone)'
      return `${verbatimLead}Match voice and tone for typography only; phrase text stays verbatim:\n"${quoted}"\n\nVoice (system prompt):\n${voice}\n\nTone:\n${tone}`
    }
    case 'neon-sign':
      return `${verbatimLead}Glowing neon tube lettering on the wallpaper:\n${quoted}`
    case 'newspaper-headline':
      return `${verbatimLead}Large newsprint headline column:\n${quoted}`
    case 'graffiti-tag':
      return `${verbatimLead}Graffiti / street-art lettering on a wall:\n${quoted}`
    case 'minimalist-caption':
      return `${verbatimLead}Small minimalist caption; still show the complete phrase:\n${quoted}`
    case 'cinematic-subtitle':
      return `${verbatimLead}Cinematic lower-third subtitle with the full phrase:\n${quoted}`
  }
}
