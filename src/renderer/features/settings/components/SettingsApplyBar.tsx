import React from 'react'

type SettingsApplyBarProps = {
  onApply: () => void
  onReset: () => void
  isApplying?: boolean
}

export default function SettingsApplyBar({ onApply, onReset, isApplying = false }: SettingsApplyBarProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 pointer-events-none"
      data-testid="settings-apply-bar"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-700/90 bg-slate-900/95 backdrop-blur-md px-2 py-2 shadow-xl shadow-black/50">
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          Reset
        </button>
        <button
          type="button"
          data-testid="settings-apply-changes"
          disabled={isApplying}
          onClick={onApply}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isApplying ? 'Applying…' : 'Apply changes'}
        </button>
      </div>
    </div>
  )
}
