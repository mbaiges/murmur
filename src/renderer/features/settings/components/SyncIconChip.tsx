import React from 'react'

type SyncIconChipProps = {
  active: boolean
  onToggle: () => void
  'aria-label': string
  title: string
  'data-testid'?: string
}

export default function SyncIconChip({
  active,
  onToggle,
  'aria-label': ariaLabel,
  title,
  'data-testid': testId
}: SyncIconChipProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={ariaLabel}
      aria-pressed={active}
      title={title}
      onClick={onToggle}
      className={`inline-flex h-8 w-8 shrink-0 flex-none items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300'
          : 'border-slate-700 bg-slate-950 text-slate-500 hover:border-slate-600 hover:text-slate-300'
      }`}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    </button>
  )
}
