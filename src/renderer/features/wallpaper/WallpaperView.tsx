import { useState, useEffect } from 'react'
import { MurmurConfig, MurmurState } from '@core/domain/types'
import { getMonitorProfile } from '@core/lib/config/monitorProfiles'
import WallpaperScene from './WallpaperScene'

const api = (window as any).api

export default function WallpaperView() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<MurmurState | null>(null)
  const [monitorId, setMonitorId] = useState<string>('')
  const [activePhrase, setActivePhrase] = useState<string>('')
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mId = params.get('monitorId') || ''
    setMonitorId(mId)

    if (api) {
      api.getConfig().then(setConfig).catch(console.error)
      api.getState().then(setState).catch(console.error)

      const removeStateListener = api.onStateUpdated((updatedState: MurmurState) => {
        setState(updatedState)
      })

      const removeConfigListener = api.onConfigUpdated((updatedConfig: MurmurConfig) => {
        setConfig(updatedConfig)
      })

      return () => {
        removeStateListener()
        removeConfigListener()
      }
    }
  }, [])

  // Fade out before swapping to the new phrase
  useEffect(() => {
    if (!state || !monitorId) return
    const env = state.lastContent?.[monitorId]
    const incomingPhrase =
      env?.payload?.phrase ?? state.lastPhrases[monitorId] ?? 'Surrealism is the quiet hum of the world'
    const incomingKey = env ? JSON.stringify(env.payload) : incomingPhrase

    if (!activePhrase && !env) {
      setActivePhrase(incomingPhrase)
      return
    }

    const currentKey = env ? JSON.stringify(env.payload) : activePhrase
    if (incomingKey === currentKey && activePhrase === incomingPhrase) {
      return
    }

    if (!activePhrase) {
      setActivePhrase(incomingPhrase)
      return
    }

    if (incomingKey !== currentKey || incomingPhrase !== activePhrase) {
      setIsFadingOut(true)
      const timeout = setTimeout(() => {
        setActivePhrase(incomingPhrase)
        setIsFadingOut(false)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [state?.lastContent?.[monitorId], state?.lastPhrases?.[monitorId], monitorId])

  if (!config || !state) {
    return <div className="w-full h-full bg-slate-950" />
  }

  const monitorConf = config.monitors.find((m) => m.id === monitorId)
  const isEnabled = monitorConf ? monitorConf.enabled : true
  if (!isEnabled) {
    return <div className="w-full h-full bg-slate-950" />
  }

  if (!activePhrase) {
    return <div className="w-full h-full bg-slate-950" />
  }

  return (
    <WallpaperScene
      profile={getMonitorProfile(config, monitorId)}
      phrase={activePhrase}
      layoutEnvelope={state.lastContent?.[monitorId]}
      lastRefreshTime={state.lastRefreshTime}
      lastHeadlines={state.lastHeadlines?.[monitorId]}
      lastSources={state.lastSources?.[monitorId]}
      isFadingOut={isFadingOut}
      monitorId={monitorId}
    />
  )
}
