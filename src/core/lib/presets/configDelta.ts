import type { MonitorProfile, MurmurConfig } from '../../domain/types'

/** Fields edited via unified Settings draft (Style + Voice) on a monitor profile. */
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
  'headlineSampleSize',
  'backgroundMode',
  'backgroundPresetId',
  'customBackgroundPrompt',
  'backgroundPhotoRelPath'
] as const satisfies readonly (keyof MonitorProfile)[]

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
] as const satisfies readonly (keyof MonitorProfile)[]

const VISUAL_SCALAR_KEYS = [
  'theme',
  'fontFamily',
  'textAlignment',
  'animation',
  'audioFeedback',
  'noiseIntensity',
  'vignetteStyle',
  'backgroundMode',
  'backgroundPhotoRelPath',
  'backgroundPresetId',
  'customBackgroundPrompt'
] as const satisfies readonly (keyof MonitorProfile)[]

function overlaysEqual(a: MonitorProfile['overlays'], b: MonitorProfile['overlays']): boolean {
  return (
    a.dateTime === b.dateTime &&
    a.sourceCredit === b.sourceCredit &&
    a.inspiringHeadlines === b.inspiringHeadlines
  )
}

function profilesEqual(a: MonitorProfile, b: MonitorProfile): boolean {
  if (a.feeds.length !== b.feeds.length || a.feeds.some((f, i) => f !== b.feeds[i])) return false
  for (const key of DRAFT_FIELD_KEYS) {
    if (key === 'overlays') {
      if (!overlaysEqual(a.overlays, b.overlays)) return false
    } else if (a[key] !== b[key]) {
      return false
    }
  }
  return true
}

function hasContentDeltaProfile(prev: MonitorProfile, next: MonitorProfile): boolean {
  for (const key of CONTENT_DELTA_KEYS) {
    if (prev[key] !== next[key]) return true
  }
  return false
}

function hasVisualDeltaProfile(prev: MonitorProfile, next: MonitorProfile): boolean {
  for (const key of VISUAL_SCALAR_KEYS) {
    if (prev[key] !== next[key]) return true
  }
  if (!overlaysEqual(prev.overlays, next.overlays)) return true
  return false
}

export type ConfigDeltaKind = 'none' | 'visual' | 'content'

function monitorMapsEqual(prev: MurmurConfig, next: MurmurConfig): boolean {
  if (prev.monitors.length !== next.monitors.length) return false
  for (const pm of prev.monitors) {
    const nm = next.monitors.find((m) => m.id === pm.id)
    if (!nm) return false
    if (pm.enabled !== nm.enabled) return false
    if (!profilesEqual(pm.profile, nm.profile)) return false
  }
  return true
}

/** Classify persisted config change for post-save wallpaper side effects. */
export function classifyConfigDelta(prev: MurmurConfig, next: MurmurConfig): ConfigDeltaKind {
  if (
    prev.geminiApiKey !== next.geminiApiKey ||
    prev.cloudflareAccountId !== next.cloudflareAccountId ||
    prev.cloudflareApiToken !== next.cloudflareApiToken ||
    prev.refreshIntervalMinutes !== next.refreshIntervalMinutes ||
    prev.launchAtLogin !== next.launchAtLogin
  ) {
    return 'none'
  }

  let anyContent = false
  let anyVisual = false

  const ids = new Set([...prev.monitors.map((m) => m.id), ...next.monitors.map((m) => m.id)])
  for (const id of ids) {
    const p = prev.monitors.find((m) => m.id === id)
    const n = next.monitors.find((m) => m.id === id)
    if (!p || !n) {
      anyContent = true
      continue
    }
    if (p.enabled !== n.enabled) anyVisual = true
    if (hasContentDeltaProfile(p.profile, n.profile)) anyContent = true
    else if (hasVisualDeltaProfile(p.profile, n.profile)) anyVisual = true
    if (p.profile.feeds.join() !== n.profile.feeds.join()) anyContent = true
  }

  if (anyContent) return 'content'
  if (anyVisual) return 'visual'
  if (!monitorMapsEqual(prev, next)) return 'visual'
  return 'none'
}

export function pickDraftFields(profile: MonitorProfile): Pick<MonitorProfile, DraftFieldKey> {
  return {
    theme: profile.theme,
    noiseIntensity: profile.noiseIntensity,
    vignetteStyle: profile.vignetteStyle,
    fontFamily: profile.fontFamily,
    textAlignment: profile.textAlignment,
    layoutStyle: profile.layoutStyle,
    animation: profile.animation,
    audioFeedback: profile.audioFeedback,
    overlays: { ...profile.overlays },
    systemPrompt: profile.systemPrompt,
    tonePreset: profile.tonePreset,
    customToneText: profile.customToneText,
    language: profile.language,
    enableBold: profile.enableBold,
    enableItalic: profile.enableItalic,
    enableNewlines: profile.enableNewlines,
    enableDifferentFonts: profile.enableDifferentFonts,
    headlineSampleSize: profile.headlineSampleSize,
    backgroundMode: profile.backgroundMode,
    backgroundPresetId: profile.backgroundPresetId,
    customBackgroundPrompt: profile.customBackgroundPrompt,
    backgroundPhotoRelPath: profile.backgroundPhotoRelPath
  }
}

export function draftFieldsEqual(a: MonitorProfile, b: MonitorProfile): boolean {
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
