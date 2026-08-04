import type { MonitorProfile } from '../../domain/types'

export type TabScope = 'news' | 'voice' | 'style'

const NEWS_KEYS = ['feeds'] as const satisfies readonly (keyof MonitorProfile)[]
const VOICE_KEYS = [
  'systemPrompt',
  'tonePreset',
  'customToneText',
  'language',
  'enableBold',
  'enableItalic',
  'enableNewlines',
  'enableDifferentFonts',
  'headlineSampleSize'
] as const satisfies readonly (keyof MonitorProfile)[]
const STYLE_KEYS = [
  'theme',
  'animation',
  'overlays',
  'fontFamily',
  'textAlignment',
  'layoutStyle',
  'vignetteStyle',
  'audioFeedback',
  'noiseIntensity',
  'backgroundMode',
  'backgroundPhotoRelPath',
  'backgroundPresetId',
  'customBackgroundPrompt'
] as const satisfies readonly (keyof MonitorProfile)[]

export function scopeFieldKeys(scope: TabScope): readonly (keyof MonitorProfile)[] {
  switch (scope) {
    case 'news':
      return NEWS_KEYS
    case 'voice':
      return VOICE_KEYS
    case 'style':
      return STYLE_KEYS
  }
}

export function pickScopePatch(scope: TabScope, patch: Partial<MonitorProfile>): Partial<MonitorProfile> {
  const keys = scopeFieldKeys(scope)
  const out: Partial<MonitorProfile> = {}
  for (const key of keys) {
    if (key in patch && patch[key] !== undefined) {
      ;(out as Record<string, unknown>)[key] = patch[key]
    }
  }
  return out
}

export function mergeProfilePatch(profile: MonitorProfile, patch: Partial<MonitorProfile>): MonitorProfile {
  const next = { ...profile, ...patch }
  if (patch.overlays) {
    next.overlays = { ...profile.overlays, ...patch.overlays }
  }
  return next
}
