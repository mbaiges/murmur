import React from 'react'
import type { MonitorProfile } from '@core/domain/types'
import { AESTHETIC_MOOD_IDS, isAestheticMoodActive, type AestheticMoodId } from '@core/lib/presets/aestheticMoods'

const MOOD_UI: Record<
  AestheticMoodId,
  { tagline: string; description: string; gradient: string; borderHover: string; icon: React.ReactNode }
> = {
  'Rogue Terminal': {
    tagline: 'Cyberpunk Aesthetic',
    description: 'Cold technological workspace — terminal energy and neon grit.',
    gradient: 'from-emerald-950/40 via-cyan-950/20 to-slate-950',
    borderHover: 'hover:border-cyan-500/50',
    icon: (
      <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  'Zen Study': {
    tagline: 'Minimalist Paper Aesthetic',
    description: 'Peaceful, slow-flowing style like handmade paper and classic books.',
    gradient: 'from-orange-950/20 via-stone-900/40 to-slate-950',
    borderHover: 'hover:border-orange-500/50',
    icon: (
      <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  'Gothic Novelist': {
    tagline: 'Moody Literary Aesthetic',
    description: 'Dark romantic fog — Victorian mystery by candlelight.',
    gradient: 'from-slate-900 via-indigo-950/20 to-slate-950',
    borderHover: 'hover:border-indigo-500/50',
    icon: (
      <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
      </svg>
    )
  },
  'Clickbait Press': {
    tagline: 'Satirical News Aesthetic',
    description: 'Loud tabloid parody — high-impact headline energy.',
    gradient: 'from-rose-955/20 via-red-950/20 to-slate-950',
    borderHover: 'hover:border-rose-500/50',
    icon: (
      <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    )
  }
}

type MoodGalleryProps = {
  config: MonitorProfile
  onMoodChange: (moodName: string) => void
}

export default function MoodGallery({ config, onMoodChange }: MoodGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {AESTHETIC_MOOD_IDS.map((id) => {
        const ui = MOOD_UI[id]
        const active = isAestheticMoodActive(config, id)
        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            data-testid={`mood-card-${id.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => !active && onMoodChange(id)}
            onKeyDown={(e) => {
              if (!active && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onMoodChange(id)
              }
            }}
            className={`cursor-pointer bg-slate-900 border rounded-2xl p-6 space-y-4 transition-all duration-300 bg-gradient-to-br ${ui.gradient} ${
              active ? 'border-indigo-500 ring-1 ring-indigo-500/40' : `border-slate-800 ${ui.borderHover}`
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">{ui.icon}</div>
              {active && (
                <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{id}</h3>
              <p className="text-xs text-indigo-400 font-medium">{ui.tagline}</p>
              <p className="text-slate-400 text-xs mt-2">{ui.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
