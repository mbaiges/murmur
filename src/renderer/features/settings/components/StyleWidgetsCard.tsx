import React from 'react'
import type { MonitorProfile } from '@core/domain/types'

type StyleWidgetsCardProps = {
  config: MonitorProfile
  patchDraft: (partial: Partial<MonitorProfile>) => void
}

const WIDGETS: {
  key: keyof MonitorProfile['overlays']
  label: string
  hint: string
}[] = [
  { key: 'dateTime', label: 'Date & time', hint: 'Corner clock' },
  { key: 'sourceCredit', label: 'Source credits', hint: 'Bottom-right' },
  { key: 'inspiringHeadlines', label: 'Concepts sampled', hint: 'Bottom-left list' }
]

export default function StyleWidgetsCard({ config, patchDraft }: StyleWidgetsCardProps) {
  const toggle = (key: keyof MurmurConfig['overlays']) => {
    patchDraft({
      overlays: { ...config.overlays, [key]: !config.overlays[key] }
    })
  }

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
      data-testid="style-section-widgets"
    >
      <div>
        <h3 className="text-sm font-bold text-white">Widgets</h3>
        <p className="text-xs text-slate-500 mt-1">Optional overlays on the wallpaper. Tap to toggle.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Wallpaper widgets">
        {WIDGETS.map(({ key, label, hint }) => {
          const active = config.overlays[key]
          return (
            <button
              key={key}
              type="button"
              data-testid={`widget-chip-${key}`}
              aria-pressed={active}
              onClick={() => toggle(key)}
              className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors min-w-[7.5rem] ${
                active
                  ? 'border-indigo-500 bg-indigo-950/80 text-indigo-100'
                  : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span className="text-xs font-medium">{label}</span>
              <span className={`text-[10px] mt-0.5 ${active ? 'text-indigo-300/80' : 'text-slate-600'}`}>
                {hint}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
