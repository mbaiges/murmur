import type { MonitorProfile } from '../../domain/types'

export type TonePreset = MonitorProfile['tonePreset']

/** Must match VoiceTab / FeedsTab `<option value="…">`. */
export const ARGENTINIAN_SPANISH_LANGUAGE = 'Argentinian Spanish'

const TURRO_BASE =
  'Use a very rude, informal register: blunt slang and rough phrasing where it fits the headlines—not polished news language. Stay intelligible; do not insult people based on identity, class, or background.'

const TURRO_WITH_ARGENTINIAN_SPANISH =
  'Write in Argentinian Spanish (Rioplatense) with turro-style slang: deliberately rude, colloquial, and street-natural where it fits the headlines. Use heavy informal rioplatense phrasing and lunfardo when it serves the line—not journalistic Spanish. Stay intelligible; keep the edge in the wording, not bigotry or attacks on groups or individuals.'

const BUILTIN: Record<Exclude<TonePreset, 'none' | 'custom'>, string> = {
  neutral:
    'Remain neutral and impartial. Avoid sensationalism, editorializing, or emotional manipulation when transforming the headlines.',
  professional:
    'Use a professional, clear newsroom register. Be concise, factual, and suitable for a broad audience.',
  turro: TURRO_BASE
}

export function resolveToneInstruction(
  config: Pick<MonitorProfile, 'tonePreset' | 'customToneText' | 'language'>
): string | null {
  switch (config.tonePreset) {
    case 'none':
      return null
    case 'custom': {
      const text = config.customToneText.trim()
      return text.length > 0 ? text : null
    }
    case 'neutral':
    case 'professional':
      return BUILTIN[config.tonePreset]
    case 'turro':
      return config.language === ARGENTINIAN_SPANISH_LANGUAGE ? TURRO_WITH_ARGENTINIAN_SPANISH : BUILTIN.turro
    default:
      return null
  }
}
