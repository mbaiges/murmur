import React, { useState, useEffect } from 'react'
import { MurmurConfig, MurmurState } from '../domain/types'

const api = (window as any).api

export default function WallpaperView() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<MurmurState | null>(null)
  const [monitorId, setMonitorId] = useState<string>('')

  useEffect(() => {
    // 1. Get monitorId from search query parameters
    const params = new URLSearchParams(window.location.search)
    const mId = params.get('monitorId') || ''
    setMonitorId(mId)

    // 2. Fetch initial config and state
    if (api) {
      api.getConfig().then(setConfig).catch(console.error)
      api.getState().then(setState).catch(console.error)

      // 3. Listen to state updates
      const removeListener = api.onStateUpdated((updatedState: MurmurState) => {
        setState(updatedState)
      })
      return () => removeListener()
    }
  }, [])

  if (!config || !state) {
    return <div className="w-screen h-screen bg-slate-950" />
  }

  // Get active monitor settings
  const monitorConf = config.monitors.find((m) => m.id === monitorId)
  const isEnabled = monitorConf ? monitorConf.enabled : true
  if (!isEnabled) {
    return <div className="w-screen h-screen bg-slate-950" />
  }

  const theme = monitorConf?.themeOverride || config.theme
  const isDark = ['Midnight', 'Drift', 'Static'].includes(theme)
  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400/60' : 'text-slate-500/60'

  const phrase = state.lastPhrases[monitorId] || ''

  // Font class mapping
  let fontClass = 'font-serif'
  if (config.fontFamily === 'EB Garamond') fontClass = 'font-eb-garamond'
  else if (config.fontFamily === 'Playfair Display') fontClass = 'font-playfair'
  else if (config.fontFamily === 'Outfit') fontClass = 'font-outfit'

  // Text Alignment
  let alignmentClass = 'text-center items-center'
  if (config.textAlignment === 'left') alignmentClass = 'text-left items-start'
  else if (config.textAlignment === 'right') alignmentClass = 'text-right items-end'

  // Layout Style
  let layoutClass = 'w-full max-w-3xl px-16 justify-center'
  if (config.layoutStyle === 'editorial-left') {
    layoutClass = 'w-full max-w-xl pl-20 pr-6 justify-start items-start text-left'
  } else if (config.layoutStyle === 'editorial-right') {
    layoutClass = 'w-full max-w-xl pr-20 pl-6 justify-end items-end text-right'
  } else if (config.layoutStyle === 'scattered') {
    layoutClass = 'w-full h-full relative p-20'
  }

  // Animation Transition Classes
  let animClass = 'transition-all duration-1000'
  if (config.animation === 'Fade') animClass = 'animate-fade-in'
  else if (config.animation === 'DriftIn') animClass = 'animate-drift-in'
  else if (config.animation === 'Morph') animClass = 'animate-morph-in'
  else if (config.animation === 'Typewriter') animClass = 'animate-typewriter-fade'

  // Simple seeded random helper for scattered layout
  const createSeededRandom = (seedStr: string) => {
    let h = 1779033703 ^ seedStr.length
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
      h = (h << 13) | (h >>> 19)
    }
    let seed = h >>> 0
    return () => {
      seed = (seed + 0x9e3779b9) | 0
      let z = seed
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b)
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35)
      return ((z ^ (z >>> 16)) >>> 0) / 4294967296
    }
  }

  const renderScatteredLayout = () => {
    if (!phrase) return null
    const rand = createSeededRandom(phrase)
    const words = phrase.split(' ')

    return (
      <div className="w-full h-full relative">
        {words.map((word, index) => {
          const x = 15 + rand() * 70 // 15% to 85%
          const y = 20 + rand() * 60 // 20% to 80%
          const rotation = (rand() - 0.5) * 20 // -10deg to 10deg
          const scale = 0.8 + rand() * 0.6
          const opacity = 0.4 + rand() * 0.6

          return (
            <span
              key={index}
              className={`absolute select-none transform ${fontClass} ${textColor} ${animClass}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                opacity,
                fontSize: 'clamp(1.2rem, 2.5vw, 2.8rem)',
                textShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {word}
            </span>
          )
        })}
      </div>
    )
  };

  const renderClassicLayout = () => {
    return (
      <div className={`flex flex-col ${alignmentClass} ${animClass} w-full`}>
        <h1 
          key={phrase} // Key changes trigger CSS animation restarts!
          className={`${textColor} ${fontClass} ${animClass} leading-relaxed select-none tracking-wide antialiased`}
          style={{ fontSize: 'clamp(1.6rem, 3.6vw, 3.2rem)', textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          {phrase || 'Surrealism is the quiet hum of the world'}
        </h1>
      </div>
    )
  };

  // Theme styles classes
  let bgThemeClass = ''
  if (theme === 'Midnight') bgThemeClass = 'bg-midnight-gradient animate-midnight-spin'
  else if (theme === 'Drift') bgThemeClass = 'bg-drift-gradient animate-drift-spin'
  else if (theme === 'Parchment') bgThemeClass = 'bg-[#f4efe2]'
  else if (theme === 'Blanc') bgThemeClass = 'bg-[#f8f9fa]'
  else bgThemeClass = 'bg-slate-950'

  return (
    <div className={`w-screen h-screen flex items-center justify-center relative overflow-hidden select-none ${bgThemeClass}`}>
      
      {/* 1. Grain/Noise Overlay */}
      {config.noiseIntensity !== 'none' && (
        <div className={`absolute inset-0 pointer-events-none mix-blend-overlay ${
          config.noiseIntensity === 'subtle' ? 'opacity-[0.035]' : 'opacity-[0.08]'
        } bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F200%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]`} />
      )}

      {/* 2. Vignette Overlay */}
      {config.vignette && (
        <div className="absolute inset-0 pointer-events-none bg-radial-vignette" />
      )}

      {/* 3. Date & Time Widget (Top Right) */}
      {config.overlays.dateTime && (
        <div className={`absolute top-12 right-12 text-right ${textColor} font-sans`}>
          <ClockWidget />
        </div>
      )}

      {/* 4. Concepts Sampled (Bottom Left) */}
      {config.overlays.inspiringHeadlines && state.lastRefreshTime && (
        <div className={`absolute bottom-12 left-12 space-y-1.5 ${mutedColor} max-w-sm font-sans select-none animate-fade-in`}>
          <p className="text-[10px] font-bold tracking-widest uppercase">Concepts Sampled</p>
          <div className="text-xs space-y-1">
            <p>• Quantum fluctuations in regulatory bounds</p>
            <p>• Artificial gravity drifts in local news</p>
            <p>• Micro-aggregations of poetry feeds</p>
          </div>
        </div>
      )}

      {/* 5. Source Credits (Bottom Right) */}
      {config.overlays.sourceCredit && state.lastRefreshTime && (
        <div className={`absolute bottom-12 right-12 text-right ${mutedColor} font-sans text-xs select-none animate-fade-in`}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1">Sources Contributed</p>
          <p className="italic">BBC News, NYT Science</p>
        </div>
      )}

      {/* 6. Main Poetic Phrase Container */}
      <div className={`flex flex-col items-center select-none ${layoutClass}`}>
        {config.layoutStyle === 'scattered' ? renderScatteredLayout() : renderClassicLayout()}
      </div>
    </div>
  )
}

function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  const formattedTime = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider uppercase opacity-60">{formattedDate}</p>
      <p className="text-2xl font-bold tracking-widest mt-1 font-mono">{formattedTime}</p>
    </div>
  )
}
