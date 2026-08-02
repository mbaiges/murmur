import React from 'react'

type SettingsApplyBarProps = {
  onApply: () => void
  onReset: () => void
  isApplying?: boolean
}

export default function SettingsApplyBar({ onApply, onReset, isApplying = false }: SettingsApplyBarProps) {
  return (
    <div
      className="sticky bottom-0 z-40 -mx-10 -mb-10 mt-8 border-t border-slate-800 bg-slate-950/95 backdrop-blur px-10 py-4 flex flex-wrap items-center justify-between gap-3"
      data-testid="settings-apply-bar"
    >
      <p className="text-xs text-slate-400">You have unapplied Style and Voice changes.</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900"
        >
          Reset draft
        </button>
        <button
          type="button"
          data-testid="settings-apply-changes"
          disabled={isApplying}
          onClick={onApply}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isApplying ? 'Applying…' : 'Apply changes'}
        </button>
      </div>
    </div>
  )
}
