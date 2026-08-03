import type { MonitorProfile } from '../../domain/types'

export type TonePreset = MonitorProfile['tonePreset']

const BUILTIN: Record<Exclude<TonePreset, 'none' | 'custom'>, string> = {
  neutral:
    'Remain neutral and impartial. Avoid sensationalism, editorializing, or emotional manipulation when transforming the headlines.',
  professional:
    'Use a professional, clear newsroom register. Be concise, factual, and suitable for a broad audience.',
  vulgar:
    'Write in a deliberately vulgar, informal register where it fits the headlines. Stay intelligible; do not sanitize into corporate news tone.'
}

export function resolveToneInstruction(
  config: Pick<MonitorProfile, 'tonePreset' | 'customToneText'>
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
    case 'vulgar':
      return BUILTIN[config.tonePreset]
    default:
      return null
  }
}
