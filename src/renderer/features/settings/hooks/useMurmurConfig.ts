import { useCallback, useEffect, useState } from 'react'
import type { MurmurConfig, MurmurState } from '@core/domain/types'
import type { ToastState } from '../types'
import { getWindowApi } from './getWindowApi'

export function useMurmurConfig() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<MurmurState | null>(null)
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
      try {
        await api.saveConfig(updatedConfig)
        const fresh = await api.getConfig()
        setConfig(fresh)
        showToast('Settings saved successfully')
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
