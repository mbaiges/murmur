import React from 'react'

type SettingsSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** `sm` for compact inline controls (monitor theme, preset picker). */
  selectSize?: 'sm' | 'md'
}

export default function SettingsSelect({
  selectSize = 'md',
  className = '',
  ...props
}: SettingsSelectProps) {
  const sizeClass =
    selectSize === 'sm'
      ? 'pl-2 pr-8 py-1 text-xs text-slate-200'
      : 'w-full pl-3 pr-9 py-2 text-sm text-slate-100'

  return (
    <select
      className={`murmur-select bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg outline-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${className}`.trim()}
      {...props}
    />
  )
}
