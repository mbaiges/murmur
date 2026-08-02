import type { MurmurConfig } from '../../domain/types'

export type TonePreset = MurmurConfig['tonePreset']

const BUILTIN: Record<Exclude<TonePreset, 'none' | 'custom'>, string> = {
  neutral:
    'Remain neutral and impartial. Avoid sensationalism, editorializing, or emotional manipulation when transforming the headlines.',
  professional:
    'Use a professional, clear newsroom register. Be concise, factual, and suitable for a broad audience.',
  villero:
    'Write in Argentine street / villero register: informal, rough, and deliberately vulgar where it fits the headlines. Stay intelligible; do not sanitize into corporate news tone.'
}

export function resolveToneInstruction(config: Pick<MurmurConfig, 'tonePreset' | 'customToneText'>): string | null {
  switch (config.tonePreset) {
    case 'none':
      return null
    case 'custom': {
      const text = config.customToneText.trim()
      return text.length > 0 ? text : null
    }
    case 'neutral':
    case 'professional':
    case 'villero':
      return BUILTIN[config.tonePreset]
    default:
      return null
  }
}
