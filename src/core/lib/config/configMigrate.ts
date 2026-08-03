import type { MonitorConfig, MonitorProfile, MurmurConfig, ThemeName } from '../../domain/types'
import { getDefaultMonitorProfile } from './defaultMonitorProfile'

type LegacyRoot = Record<string, unknown>

function normalizeTonePreset(value: unknown): MonitorProfile['tonePreset'] | undefined {
  if (value === 'villero' || value === 'vulgar') return 'turro'
  if (
    value === 'none' ||
    value === 'neutral' ||
    value === 'professional' ||
    value === 'turro' ||
    value === 'custom'
  ) {
    return value
  }
  return undefined
}

function legacyProfileFromRoot(parsed: LegacyRoot): MonitorProfile {
  const base = getDefaultMonitorProfile()
  const pick = <K extends keyof MonitorProfile>(key: K): MonitorProfile[K] | undefined =>
    parsed[key] !== undefined ? (parsed[key] as MonitorProfile[K]) : undefined

  return {
    ...base,
    feeds: Array.isArray(parsed.feeds) ? (parsed.feeds as string[]) : base.feeds,
    language: pick('language') ?? base.language,
    theme: pick('theme') ?? base.theme,
    animation: pick('animation') ?? base.animation,
    overlays: parsed.overlays && typeof parsed.overlays === 'object'
      ? { ...base.overlays, ...(parsed.overlays as MonitorProfile['overlays']) }
      : base.overlays,
    headlineSampleSize: typeof parsed.headlineSampleSize === 'number' ? parsed.headlineSampleSize : base.headlineSampleSize,
    fontFamily: pick('fontFamily') ?? base.fontFamily,
    textAlignment: pick('textAlignment') ?? base.textAlignment,
    layoutStyle: pick('layoutStyle') ?? base.layoutStyle,
    vignetteStyle: pick('vignetteStyle') ?? base.vignetteStyle,
    audioFeedback: typeof parsed.audioFeedback === 'boolean' ? parsed.audioFeedback : base.audioFeedback,
    systemPrompt: typeof parsed.systemPrompt === 'string' ? parsed.systemPrompt : base.systemPrompt,
    enableBold: typeof parsed.enableBold === 'boolean' ? parsed.enableBold : base.enableBold,
    enableItalic: typeof parsed.enableItalic === 'boolean' ? parsed.enableItalic : base.enableItalic,
    enableNewlines: typeof parsed.enableNewlines === 'boolean' ? parsed.enableNewlines : base.enableNewlines,
    enableDifferentFonts:
      typeof parsed.enableDifferentFonts === 'boolean' ? parsed.enableDifferentFonts : base.enableDifferentFonts,
    noiseIntensity: pick('noiseIntensity') ?? base.noiseIntensity,
    tonePreset: normalizeTonePreset(parsed.tonePreset) ?? pick('tonePreset') ?? base.tonePreset,
    customToneText: typeof parsed.customToneText === 'string' ? parsed.customToneText : base.customToneText
  }
}

function migrateMonitorRow(raw: Record<string, unknown>, legacyProfile: MonitorProfile): MonitorConfig {
  const themeOverride = raw.themeOverride as ThemeName | undefined
  const profile =
    raw.profile && typeof raw.profile === 'object'
      ? { ...legacyProfile, ...(raw.profile as MonitorProfile) }
      : { ...legacyProfile }

  if (themeOverride) {
    profile.theme = themeOverride
  }

  const legacyTone = profile.tonePreset as string
  if (legacyTone === 'villero' || legacyTone === 'vulgar') {
    profile.tonePreset = 'turro'
  }

  return {
    id: String(raw.id),
    enabled: raw.enabled !== false,
    syncNews: raw.syncNews !== false,
    syncVoice: raw.syncVoice !== false,
    syncStyle: raw.syncStyle !== false,
    profile
  }
}

/** Normalize raw JSON (v1 flat or partial v2) into v2 shape before Zod parse. */
export function migrateRawConfigToV2(parsed: LegacyRoot): MurmurConfig {
  const legacyProfile = legacyProfileFromRoot(parsed)

  if (parsed.configVersion === 2 && Array.isArray(parsed.monitors)) {
    const monitors = (parsed.monitors as Record<string, unknown>[]).map((m) => migrateMonitorRow(m, legacyProfile))
    return {
      configVersion: 2,
      geminiApiKey: typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
      refreshIntervalMinutes:
        typeof parsed.refreshIntervalMinutes === 'number' ? parsed.refreshIntervalMinutes : 60,
      launchAtLogin: parsed.launchAtLogin === true,
      monitors
    }
  }

  const rawMonitors = Array.isArray(parsed.monitors) ? (parsed.monitors as Record<string, unknown>[]) : []
  const monitors: MonitorConfig[] =
    rawMonitors.length > 0 ? rawMonitors.map((m) => migrateMonitorRow(m, { ...legacyProfile })) : []

  return {
    configVersion: 2,
    geminiApiKey: typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
    refreshIntervalMinutes:
      typeof parsed.refreshIntervalMinutes === 'number' ? parsed.refreshIntervalMinutes : 60,
    launchAtLogin: parsed.launchAtLogin === true,
    monitors
  }
}
