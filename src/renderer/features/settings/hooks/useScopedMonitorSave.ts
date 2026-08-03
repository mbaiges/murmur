import { useCallback } from 'react'
import type { MonitorConfig, MonitorProfile, MurmurConfig } from '@core/domain/types'
import { propagateProfilePatch, setSyncFlag, updateMonitorInConfig } from '@core/lib/config/monitorSync'
import type { TabScope } from '@core/lib/config/monitorScopeFields'
import { getMonitorEntry } from '@core/lib/config/monitorProfiles'
import { getWindowApi } from './getWindowApi'

type UseScopedMonitorSaveArgs = {
  getConfigSnapshot: () => MurmurConfig | null
  applyLocalConfig: (next: MurmurConfig) => void
  saveConfig: (partial: Partial<MurmurConfig>, options?: { silent?: boolean }) => Promise<void>
}

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

export function useScopedMonitorSave({
  getConfigSnapshot,
  applyLocalConfig,
  saveConfig
}: UseScopedMonitorSaveArgs) {
  const saveMonitors = useCallback(
    async (monitors: MonitorConfig[], options?: { silent?: boolean }) => {
      await saveConfig({ monitors }, options)
    },
    [saveConfig]
  )

  const saveProfilePatch = useCallback(
    async (monitorId: string, scope: TabScope, patch: Partial<MonitorProfile>) => {
      const config = getConfigSnapshot()
      if (!config) return
      const next = applyMonitorProfileSave(config, monitorId, scope, patch)
      applyLocalConfig(next)
      try {
        await saveMonitors(next.monitors, { silent: true })
      } catch (err) {
        const api = getWindowApi()
        if (api) {
          applyLocalConfig(await api.getConfig())
        }
        throw err
      }
    },
    [applyLocalConfig, getConfigSnapshot, saveMonitors]
  )

  const saveSyncFlag = useCallback(
    async (monitorId: string, scope: TabScope | 'all', enabled: boolean) => {
      const config = getConfigSnapshot()
      if (!config) return
      const next = applySyncFlagSave(config, monitorId, scope, enabled)
      applyLocalConfig(next)
      try {
        await saveMonitors(next.monitors, { silent: true })
      } catch (err) {
        const api = getWindowApi()
        if (api) {
          applyLocalConfig(await api.getConfig())
        }
        throw err
      }
    },
    [applyLocalConfig, getConfigSnapshot, saveMonitors]
  )

  return { saveProfilePatch, saveSyncFlag, saveMonitors }
}
