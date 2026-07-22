import React from 'react'
import { MurmurConfig, CYBERPUNK_TERMINAL_PROMPT, ZEN_KOAN_PROMPT, GOTHIC_PURPLE_PROSE_PROMPT, WORST_NEWS_TITLE_PROMPT } from '../../domain/types'

interface MoodDefinition {
  id: string
  name: string
  tagline: string
  description: string
  icon: React.ReactNode
  gradient: string
  borderHover: string
  checks: {
    theme: string
    font: string
    animation: string
    audio: string
    layout: string
    vignette: string
  }
}

interface MoodsTabProps {
  config: MurmurConfig
  onMoodChange: (moodName: string) => void
}

export default function MoodsTab({ config, onMoodChange }: MoodsTabProps) {
  const moods: MoodDefinition[] = [
    {
      id: 'Rogue Terminal',
      name: 'Rogue Terminal',
      tagline: 'Cyberpunk Aesthetic',
      description: 'A cold, technological workspace vibe that feels like a hacking terminal or space console.',
      gradient: 'from-emerald-950/40 via-cyan-950/20 to-slate-950',
      borderHover: 'hover:border-cyan-500/50',
      icon: (
        <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      checks: {
        theme: 'Cyberpunk',
        font: 'Monospace',
        layout: 'editorial-left',
        animation: 'Typewriter',
        audio: 'Mechanical Click',
        vignette: 'Dramatic'
      }
    },
    {
      id: 'Zen Study',
      name: 'Zen Study',
      tagline: 'Minimalist Paper Aesthetic',
      description: 'A peaceful, slow-flowing style that feels like reading a classic book or looking at handmade paper.',
      gradient: 'from-orange-950/20 via-stone-900/40 to-slate-950',
      borderHover: 'hover:border-orange-500/50',
      icon: (
        <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      checks: {
        theme: 'Parchment',
        font: 'EB Garamond',
        layout: 'book-cover',
        animation: 'Fade',
        audio: 'Disabled',
        vignette: 'Soft'
      }
    },
    {
      id: 'Gothic Novelist',
      name: 'Gothic Novelist',
      tagline: 'Moody Literary Aesthetic',
      description: 'A dark, foggy, romantic style that feels like writing an old Victorian mystery novel by candlelight.',
      gradient: 'from-slate-900 via-indigo-950/20 to-slate-950',
      borderHover: 'hover:border-indigo-500/50',
      icon: (
        <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      ),
      checks: {
        theme: 'Drift',
        font: 'Playfair Display',
        layout: 'asymmetrical',
        animation: 'DriftIn',
        audio: 'Disabled',
        vignette: 'Dramatic'
      }
    },
    {
      id: 'Clickbait Press',
      name: 'Clickbait Press',
      tagline: 'Satirical News Aesthetic',
      description: 'A loud, high-impact style that parodies modern clickbait media and tabloid headlines.',
      gradient: 'from-rose-955/20 via-red-950/20 to-slate-950',
      borderHover: 'hover:border-rose-500/50',
      icon: (
        <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      checks: {
        theme: 'Crimson',
        font: 'Outfit',
        layout: 'centered',
        animation: 'Instant',
        audio: 'Disabled',
        vignette: 'None'
      }
    }
  ]

  const isMoodActive = (mood: MoodDefinition): boolean => {
    if (mood.id === 'Rogue Terminal') {
      return (
        config.systemPrompt === CYBERPUNK_TERMINAL_PROMPT &&
        config.theme === 'Cyberpunk' &&
        config.fontFamily === 'Monospace' &&
        config.layoutStyle === 'editorial-left' &&
        config.animation === 'Typewriter' &&
        config.audioFeedback === true &&
        config.vignetteStyle === 'dramatic' &&
        config.noiseIntensity === 'heavy'
      )
    }
    if (mood.id === 'Zen Study') {
      return (
        config.systemPrompt === ZEN_KOAN_PROMPT &&
        config.theme === 'Parchment' &&
        config.fontFamily === 'EB Garamond' &&
        config.layoutStyle === 'book-cover' &&
        config.animation === 'Fade' &&
        config.audioFeedback === false &&
        config.vignetteStyle === 'soft' &&
        config.noiseIntensity === 'subtle'
      )
    }
    if (mood.id === 'Gothic Novelist') {
      return (
        config.systemPrompt === GOTHIC_PURPLE_PROSE_PROMPT &&
        config.theme === 'Drift' &&
        config.fontFamily === 'Playfair Display' &&
        config.layoutStyle === 'asymmetrical' &&
        config.animation === 'DriftIn' &&
        config.audioFeedback === false &&
        config.vignetteStyle === 'dramatic' &&
        config.noiseIntensity === 'subtle'
      )
    }
    if (mood.id === 'Clickbait Press') {
      return (
        config.systemPrompt === WORST_NEWS_TITLE_PROMPT &&
        config.theme === 'Crimson' &&
        config.fontFamily === 'Outfit' &&
        config.layoutStyle === 'centered' &&
        config.animation === 'Instant' &&
        config.audioFeedback === false &&
        config.vignetteStyle === 'none' &&
        config.noiseIntensity === 'none'
      )
    }
    return false
  }

  const anyMoodActive = moods.some(isMoodActive)

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Aesthetic Moods</h2>
        <p className="text-slate-400 text-sm">
          Select a master preset to coordinate the AI phrase prompt, background gradient, typography layout, reveal animations, and sound effects instantly.
        </p>
      </div>

      {/* Manual Override Custom Indicator */}
      {!anyMoodActive && (
        <div className="flex items-center space-x-3 px-4 py-3 bg-amber-955 border border-amber-900 rounded-xl text-amber-300 text-xs animate-fade-in">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>Manual Mode Active:</strong> You have override settings configured. Activating any of the moods below will align your current settings with that specific aesthetic.
          </span>
        </div>
      )}

      {/* Grid of Mood Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moods.map((mood) => {
          const active = isMoodActive(mood)
          return (
            <div
              key={mood.id}
              data-testid={`mood-card-${mood.id.toLowerCase().replace(/\s+/g, '-')}`}
              className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl bg-gradient-to-br ${mood.gradient} ${
                active ? 'border-indigo-500 shadow-indigo-950/20' : 'border-slate-800 ' + mood.borderHover
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    {mood.icon}
                  </div>
                  {active ? (
                    <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-inner animate-pulse">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Preset
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">{mood.name}</h3>
                  <p className="text-xs text-indigo-400 font-medium tracking-wide">{mood.tagline}</p>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{mood.description}</p>
                </div>

                {/* Configuration Parameters Checklist */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-800/60 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Theme</span>
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{mood.checks.theme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Font</span>
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{mood.checks.font}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Layout</span>
                    <span className="text-slate-300 font-medium truncate max-w-[100px] capitalize">{mood.checks.layout.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Animation</span>
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{mood.checks.animation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sound FX</span>
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{mood.checks.audio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vignette</span>
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{mood.checks.vignette}</span>
                  </div>
                </div>
              </div>

              <button
                disabled={active}
                onClick={() => onMoodChange(mood.id)}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'bg-slate-950 border border-slate-850 text-slate-500 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg active:scale-95'
                }`}
              >
                {active ? 'Currently Active' : 'Activate Mood'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
