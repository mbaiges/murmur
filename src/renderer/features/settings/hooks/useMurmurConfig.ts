import { useCallback, useEffect, useState } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import type { ToastState, SettingsUiState } from '../types'
import { getWindowApi } from './getWindowApi'

const STORAGE_KEY = 'murmur.settingsUi.v1'

function isToneOnlyPatch(partial: Partial<MurmurConfig>): boolean {
  const keys = Object.keys(partial)
  return keys.length > 0 && keys.every((k) => k === 'tonePreset' || k === 'customToneText')
}

export function useMurmurConfig() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<import('@core/domain/types').MurmurState | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    const api = getWindowApi()
    if (!api) return

    api.getConfig().then(setConfig).catch(console.error)
    api.getState().then(setState).catch(console.error)

    const removeStateListener = api.onStateUpdated(setState)
    const removeConfigListener = api.onConfigUpdated(setConfig)

    return () => {
      removeStateListener()
      removeConfigListener()
    }
  }, [])

  useEffect(() => {
    if (state?.lastGenerationError) {
      setToast({ message: state.lastGenerationError, type: 'error' })
      const timer = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [state?.lastGenerationError])

  const saveConfig = useCallback(
    async (updatedConfig: Partial<MurmurConfig>) => {
      const api = getWindowApi()
      if (!api || !config) return

      if (updatedConfig.tonePreset === 'custom') {
        const text = (updatedConfig.customToneText ?? config.customToneText).trim()
        if (!text) {
          showToast('Enter custom tone text before saving', 'error')
          return
        }
      }

      try {
        await api.saveConfig(updatedConfig)
        const fresh = await api.getConfig()
        setConfig(fresh)
        if (isToneOnlyPatch(updatedConfig)) {
          showToast('Phrase updated with new tone')
        } else {
          showToast('Settings saved successfully')
        }
      } catch (err: unknown) {
        console.error(err)
        const message = err instanceof Error ? err.message : 'Failed to save settings'
        showToast(message, 'error')
      }
    },
    [config, showToast]
  )

  return { config, state, setState, toast, showToast, saveConfig }
}

export function readSettingsUiState(): SettingsUiState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SettingsUiState
  } catch {
    return null
  }
}

export function writeSettingsUiState(state: SettingsUiState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
