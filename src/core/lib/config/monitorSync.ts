import type { MonitorConfig, MonitorProfile, MurmurConfig } from '../../domain/types'
import { mergeProfilePatch, pickScopePatch, type TabScope } from './monitorScopeFields'

function syncFlagForScope(scope: TabScope): keyof Pick<MonitorConfig, 'syncNews' | 'syncVoice' | 'syncStyle'> {
  switch (scope) {
    case 'news':
      return 'syncNews'
    case 'voice':
      return 'syncVoice'
    case 'style':
      return 'syncStyle'
  }
}

export function propagateProfilePatch(
  config: MurmurConfig,
  sourceMonitorId: string,
  scope: TabScope,
  patch: Partial<MonitorProfile>
): MurmurConfig {
  const scopePatch = pickScopePatch(scope, patch)
  if (Object.keys(scopePatch).length === 0) return config

  const source = config.monitors.find((m) => m.id === sourceMonitorId)
  if (!source) return config

  const syncKey = syncFlagForScope(scope)
  const targetIds = source[syncKey]
    ? config.monitors.filter((m) => m[syncKey]).map((m) => m.id)
    : [sourceMonitorId]

  return {
    ...config,
    monitors: config.monitors.map((m) => {
      if (!targetIds.includes(m.id)) return m
      return { ...m, profile: mergeProfilePatch(m.profile, scopePatch) }
    })
  }
}

export function updateMonitorInConfig(
  config: MurmurConfig,
  monitorId: string,
  updater: (entry: MonitorConfig) => MonitorConfig
): MurmurConfig {
  return {
    ...config,
    monitors: config.monitors.map((m) => (m.id === monitorId ? updater(m) : m))
  }
}

export function setSyncFlag(
  config: MurmurConfig,
  monitorId: string,
  scope: TabScope | 'all',
  enabled: boolean
): MurmurConfig {
  return updateMonitorInConfig(config, monitorId, (m) => {
    if (scope === 'all') {
      return { ...m, syncNews: enabled, syncVoice: enabled, syncStyle: enabled }
    }
    const key = syncFlagForScope(scope)
    return { ...m, [key]: enabled }
  })
}
