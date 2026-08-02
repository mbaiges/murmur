import React from 'react'

export type ChipOption<T extends string> = { value: T; label: string }

type SettingsChipGroupProps<T extends string> = {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label'?: string
}

export default function SettingsChipGroup<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel
}: SettingsChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              active
                ? 'border-indigo-500 bg-indigo-950/80 text-indigo-200'
                : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
