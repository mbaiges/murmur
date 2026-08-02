import type { MurmurConfig } from '../../domain/types'

/** Fields edited via unified Settings draft (Style + Voice). */
export const DRAFT_FIELD_KEYS = [
  'theme',
  'noiseIntensity',
  'vignetteStyle',
  'fontFamily',
  'textAlignment',
  'layoutStyle',
  'animation',
  'audioFeedback',
  'overlays',
  'systemPrompt',
  'tonePreset',
  'customToneText',
  'language',
  'enableBold',
  'enableItalic',
  'enableNewlines',
  'enableDifferentFonts',
  'headlineSampleSize'
] as const satisfies readonly (keyof MurmurConfig)[]

export type DraftFieldKey = (typeof DRAFT_FIELD_KEYS)[number]

const CONTENT_DELTA_KEYS = [
  'systemPrompt',
  'tonePreset',
  'customToneText',
  'language',
  'layoutStyle',
  'enableBold',
  'enableItalic',
  'enableNewlines',
  'enableDifferentFonts',
  'headlineSampleSize'
] as const satisfies readonly (keyof MurmurConfig)[]

const VISUAL_SCALAR_KEYS = [
  'theme',
  'fontFamily',
  'textAlignment',
  'animation',
  'audioFeedback',
  'noiseIntensity',
  'vignetteStyle'
] as const satisfies readonly (keyof MurmurConfig)[]

function overlaysEqual(a: MurmurConfig['overlays'], b: MurmurConfig['overlays']): boolean {
  return (
    a.dateTime === b.dateTime &&
    a.sourceCredit === b.sourceCredit &&
    a.inspiringHeadlines === b.inspiringHeadlines
  )
}

function hasContentDelta(prev: MurmurConfig, next: MurmurConfig): boolean {
  for (const key of CONTENT_DELTA_KEYS) {
    if (prev[key] !== next[key]) return true
  }
  return false
}

function hasVisualDelta(prev: MurmurConfig, next: MurmurConfig): boolean {
  for (const key of VISUAL_SCALAR_KEYS) {
    if (prev[key] !== next[key]) return true
  }
  if (!overlaysEqual(prev.overlays, next.overlays)) return true
  return false
}

export type ConfigDeltaKind = 'none' | 'visual' | 'content'

/** Classify persisted config change for post-save wallpaper side effects. */
export function classifyConfigDelta(prev: MurmurConfig, next: MurmurConfig): ConfigDeltaKind {
  if (hasContentDelta(prev, next)) return 'content'
  if (hasVisualDelta(prev, next)) return 'visual'
  return 'none'
}

export function pickDraftFields(config: MurmurConfig): Pick<MurmurConfig, DraftFieldKey> {
  return {
    theme: config.theme,
    noiseIntensity: config.noiseIntensity,
    vignetteStyle: config.vignetteStyle,
    fontFamily: config.fontFamily,
    textAlignment: config.textAlignment,
    layoutStyle: config.layoutStyle,
    animation: config.animation,
    audioFeedback: config.audioFeedback,
    overlays: { ...config.overlays },
    systemPrompt: config.systemPrompt,
    tonePreset: config.tonePreset,
    customToneText: config.customToneText,
    language: config.language,
    enableBold: config.enableBold,
    enableItalic: config.enableItalic,
    enableNewlines: config.enableNewlines,
    enableDifferentFonts: config.enableDifferentFonts,
    headlineSampleSize: config.headlineSampleSize
  }
}

export function draftFieldsEqual(a: MurmurConfig, b: MurmurConfig): boolean {
  const pa = pickDraftFields(a)
  const pb = pickDraftFields(b)
  for (const key of DRAFT_FIELD_KEYS) {
    if (key === 'overlays') {
      if (!overlaysEqual(pa.overlays, pb.overlays)) return false
    } else if (pa[key] !== pb[key]) {
      return false
    }
  }
  return true
}
