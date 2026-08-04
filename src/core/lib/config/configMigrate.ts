import type { MonitorConfig, MonitorProfile, MurmurConfig, ThemeName } from '../../domain/types'
import { getDefaultMonitorProfile } from './defaultMonitorProfile'

type LegacyRoot = Record<string, unknown>

export type MurmurConfigV2Shape = Omit<
  MurmurConfig,
  'configVersion' | 'cloudflareAccountId' | 'cloudflareApiToken'
> & { configVersion: 2 }

function normalizeTonePreset(value: unknown): MonitorProfile['tonePreset'] | undefined {
  if (value === 'villero' || value === 'turro') return 'vulgar'
  if (
    value === 'none' ||
    value === 'neutral' ||
    value === 'professional' ||
    value === 'vulgar' ||
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
  if (legacyTone === 'villero' || legacyTone === 'turro') {
    profile.tonePreset = 'vulgar'
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

/** Normalize raw JSON (v1 flat or partial v2) into v2 shape. */
export function migrateRawConfigToV2(parsed: LegacyRoot): MurmurConfigV2Shape {
  const legacyProfile = legacyProfileFromRoot(parsed)

  if (
    (parsed.configVersion === 2 || parsed.configVersion === 3) &&
    Array.isArray(parsed.monitors)
  ) {
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

export function migrateConfigV2ToV3(v2: MurmurConfigV2Shape): MurmurConfig {
  return {
    configVersion: 3,
    geminiApiKey: v2.geminiApiKey,
    cloudflareAccountId: '',
    cloudflareApiToken: '',
    refreshIntervalMinutes: v2.refreshIntervalMinutes,
    launchAtLogin: v2.launchAtLogin,
    monitors: v2.monitors.map((m) => ({
      ...m,
      profile: { ...getDefaultMonitorProfile(), ...m.profile }
    }))
  }
}

/** Normalize raw JSON through v2 then v3 before Zod parse. */
export function migrateRawConfigToLatest(parsed: LegacyRoot): MurmurConfig {
  const v2 = migrateRawConfigToV2(parsed)
  const v3 = migrateConfigV2ToV3(v2)
  if (parsed.configVersion === 3) {
    return {
      ...v3,
      cloudflareAccountId:
        typeof parsed.cloudflareAccountId === 'string' ? parsed.cloudflareAccountId : '',
      cloudflareApiToken:
        typeof parsed.cloudflareApiToken === 'string' ? parsed.cloudflareApiToken : ''
    }
  }
  return v3
}
