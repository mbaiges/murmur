import React from 'react'
import type { MonitorProfile } from '@core/domain/types'

type MarkupToggleKey = 'enableBold' | 'enableItalic' | 'enableNewlines' | 'enableDifferentFonts'

const MARKUP_TOGGLES: {
  key: MarkupToggleKey
  label: React.ReactNode
}[] = [
  { key: 'enableBold', label: <span className="font-bold">Bold</span> },
  { key: 'enableItalic', label: <span className="italic">Italic</span> },
  { key: 'enableNewlines', label: <span className="leading-none tracking-tight">Lines</span> },
  { key: 'enableDifferentFonts', label: <span className="font-mono text-[11px]">Mixed</span> }
]

type MarkupRulesChipsProps = {
  config: MonitorProfile
  patchDraft: (partial: Partial<MonitorProfile>) => void
}

export default function MarkupRulesChips({ config, patchDraft }: MarkupRulesChipsProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      role="group"
      aria-label="Markup rules"
    >
      {MARKUP_TOGGLES.map(({ key, label }) => {
        const active = config[key]
        return (
          <button
            key={key}
            type="button"
            data-testid={`markup-chip-${key}`}
            aria-pressed={active}
            onClick={() => patchDraft({ [key]: !active })}
            className={`min-h-[2.75rem] rounded-lg border px-3 py-2 text-sm transition-colors ${
              active
                ? 'border-indigo-500 bg-indigo-950/80 text-indigo-100'
                : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
