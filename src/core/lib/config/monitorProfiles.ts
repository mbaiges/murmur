import type { MonitorConfig, MonitorProfile, MurmurConfig } from '../../domain/types'
import { getDefaultMonitorProfile } from './defaultMonitorProfile'

export function cloneMonitorProfile(profile: MonitorProfile): MonitorProfile {
  return {
    ...profile,
    feeds: [...profile.feeds],
    overlays: { ...profile.overlays }
  }
}

export function createMonitorConfig(id: string, profile?: MonitorProfile): MonitorConfig {
  return {
    id,
    enabled: true,
    syncNews: true,
    syncVoice: true,
    syncStyle: true,
    profile: cloneMonitorProfile(profile ?? getDefaultMonitorProfile())
  }
}

export function getMonitorEntry(config: MurmurConfig, monitorId: string): MonitorConfig | undefined {
  return config.monitors.find((m) => m.id === monitorId)
}

export function getMonitorProfile(config: MurmurConfig, monitorId: string): MonitorProfile {
  return getMonitorEntry(config, monitorId)?.profile ?? getDefaultMonitorProfile()
}

export function collectUnionFeedUrls(config: MurmurConfig, screenIds: string[]): string[] {
  const urls = new Set<string>()
  for (const id of screenIds) {
    const entry = getMonitorEntry(config, id)
    if (!entry || !entry.enabled) continue
    for (const url of entry.profile.feeds) {
      urls.add(url)
    }
  }
  if (urls.size === 0) {
    for (const m of config.monitors) {
      if (!m.enabled) continue
      for (const url of m.profile.feeds) urls.add(url)
    }
  }
  return [...urls]
}

export function findPrimaryMonitorId(config: MurmurConfig, screenIds: string[], primaryId?: string): string {
  if (primaryId && screenIds.includes(primaryId)) return primaryId
  if (screenIds.length > 0) return screenIds[0]
  if (config.monitors.length > 0) return config.monitors[0].id
  return 'primary'
}

export function ensureMonitorsForScreens(
  config: MurmurConfig,
  screens: { id: string }[],
  primaryId?: string
): { config: MurmurConfig; dirty: boolean } {
  let dirty = false
  const monitors = [...config.monitors]
  const screenIds = screens.map((s) => s.id)
  const primary = findPrimaryMonitorId(config, screenIds, primaryId)
  // Prefer an existing profile with feeds. Using a brand-new screen id as "primary"
  // before it exists in config would seed empty/example feeds and skip painting.
  const seedSource =
    getMonitorEntry(config, primary)?.profile ??
    config.monitors.find((m) => m.profile.feeds.length > 0)?.profile ??
    config.monitors[0]?.profile
  const seedProfile = seedSource
    ? cloneMonitorProfile(seedSource)
    : getDefaultMonitorProfile()

  for (const screen of screens) {
    if (monitors.some((m) => m.id === screen.id)) continue
    monitors.push(createMonitorConfig(screen.id, seedProfile))
    dirty = true
  }

  if (!dirty) return { config, dirty: false }
  return { config: { ...config, monitors }, dirty: true }
}

export function isSyncAllTabs(entry: MonitorConfig): boolean {
  return entry.syncNews && entry.syncVoice && entry.syncStyle
}
