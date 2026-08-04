import { useCallback, useEffect, useRef, useState } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import type { ToastState, SettingsUiState } from '../types'
import { getWindowApi } from './getWindowApi'

const STORAGE_KEY = 'murmur.settingsUi.v1'

export function useMurmurConfig() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const configRef = useRef<MurmurConfig | null>(null)
  const [state, setState] = useState<import('@core/domain/types').MurmurState | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(() => {
    configRef.current = config
  }, [config])

  const applyLocalConfig = useCallback((next: MurmurConfig) => {
    configRef.current = next
    setConfig(next)
  }, [])

  const getConfigSnapshot = useCallback((): MurmurConfig | null => configRef.current, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 3000)
  }, [])

  useEffect(() => {
    const api = getWindowApi()
    if (!api) return

    api
      .getConfig()
      .then((c) => {
        configRef.current = c
        setConfig(c)
      })
      .catch(console.error)
    api.getState().then(setState).catch(console.error)

    const removeStateListener = api.onStateUpdated(setState)
    const removeConfigListener = api.onConfigUpdated((c) => {
      configRef.current = c
      setConfig(c)
    })

    const removeSettingsToast = api.onSettingsToast?.(({ message, type }) => {
      showToast(message, type)
    })

    return () => {
      removeStateListener()
      removeConfigListener()
      removeSettingsToast?.()
    }
  }, [showToast])

  const saveConfig = useCallback(
    async (updatedConfig: Partial<MurmurConfig>, options?: { silent?: boolean }) => {
      const api = getWindowApi()
      const current = configRef.current
      if (!api || !current) return

      if (updatedConfig.tonePreset === 'custom') {
        const text = (updatedConfig.customToneText ?? current.customToneText).trim()
        if (!text) {
          showToast('Enter custom tone text before saving', 'error')
          return
        }
      }

      try {
        await api.saveConfig(updatedConfig)
        const fresh = await api.getConfig()
        configRef.current = fresh
        setConfig(fresh)
        if (!options?.silent) {
          showToast('Settings saved successfully')
        }
      } catch (err: unknown) {
        console.error(err)
        const message = err instanceof Error ? err.message : 'Failed to save settings'
        showToast(message, 'error')
        throw err
      }
    },
    [showToast]
  )

  return { config, state, setState, toast, showToast, saveConfig, applyLocalConfig, getConfigSnapshot }
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
