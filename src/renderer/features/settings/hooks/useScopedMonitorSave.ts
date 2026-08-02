import { useCallback } from 'react'
import type { MonitorConfig, MonitorProfile, MurmurConfig } from '@core/domain/types'
import { propagateProfilePatch, setSyncFlag, updateMonitorInConfig } from '@core/lib/config/monitorSync'
import type { TabScope } from '@core/lib/config/monitorScopeFields'
import { getMonitorEntry } from '@core/lib/config/monitorProfiles'

type SaveMonitorsFn = (monitors: MonitorConfig[]) => Promise<void>

export function applyMonitorProfileSave(
  config: MurmurConfig,
  monitorId: string,
  scope: TabScope,
  patch: Partial<MonitorProfile>
): MurmurConfig {
  const entry = getMonitorEntry(config, monitorId)
  if (!entry) return config
  const withLocal = updateMonitorInConfig(config, monitorId, (m) => ({
    ...m,
    profile: { ...m.profile, ...patch, overlays: patch.overlays ? { ...m.profile.overlays, ...patch.overlays } : m.profile.overlays }
  }))
  return propagateProfilePatch(withLocal, monitorId, scope, patch)
}

export function applySyncFlagSave(
  config: MurmurConfig,
  monitorId: string,
  scope: TabScope | 'all',
  enabled: boolean
): MurmurConfig {
  return setSyncFlag(config, monitorId, scope, enabled)
}

export function useScopedMonitorSave(
  config: MurmurConfig | null,
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
) {
  const saveMonitors = useCallback(
    async (monitors: MonitorConfig[]) => {
      await saveConfig({ monitors })
    },
    [saveConfig]
  )

  const saveProfilePatch = useCallback(
    async (monitorId: string, scope: TabScope, patch: Partial<MonitorProfile>) => {
      if (!config) return
      const next = applyMonitorProfileSave(config, monitorId, scope, patch)
      await saveMonitors(next.monitors)
    },
    [config, saveMonitors]
  )

  const saveSyncFlag = useCallback(
    async (monitorId: string, scope: TabScope | 'all', enabled: boolean) => {
      if (!config) return
      const next = applySyncFlagSave(config, monitorId, scope, enabled)
      await saveMonitors(next.monitors)
    },
    [config, saveMonitors]
  )

  return { saveProfilePatch, saveSyncFlag, saveMonitors }
}
