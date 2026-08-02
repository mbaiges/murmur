import React from 'react'
import type { MurmurState } from '@core/domain/types'
import type { SettingsTab } from '../types'

type SettingsSidebarProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  onRefresh: () => void
  isRefreshing: boolean
  state: MurmurState | null
  hasDraftPending?: boolean
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'general',
    label: 'General',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 'news',
    label: 'News sources',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    )
  },
  {
    id: 'voice',
    label: 'Voice & prompts',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )
  },
  {
    id: 'style',
    label: 'Style',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7.343 11H7a2 2 0 00-2 2v2.343" />
      </svg>
    )
  },
  {
    id: 'displays',
    label: 'Displays',
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }
]

export default function SettingsSidebar({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  state,
  hasDraftPending = false
}: SettingsSidebarProps) {
  const tabClass = (tab: SettingsTab) =>
    `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      activeTab === tab
        ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`

  const showDraftDot = (tab: SettingsTab) =>
    hasDraftPending && (tab === 'style' || tab === 'voice')

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
      <div className="space-y-8">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Murmur</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Desktop wallpaper app</p>
          </div>
          <img src="./logo.png" className="h-10 w-10 object-contain rounded-lg border border-slate-800 p-1 bg-slate-955" alt="" />
        </div>

        <nav className="space-y-1">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} type="button" onClick={() => onTabChange(id)} className={tabClass(id)}>
              {icon}
              <span className="flex-1 text-left">{label}</span>
              {showDraftDot(id) && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"
                  title="Unapplied Style or Voice draft"
                  aria-hidden
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-xs text-white shadow-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isRefreshing && (
            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
        </button>

        <div className="text-[10px] text-slate-500 leading-normal text-center">
          {state?.lastRefreshTime ? `Last update: ${state.lastRefreshTime}` : 'Idle'}
        </div>
      </div>
    </aside>
  )
}
