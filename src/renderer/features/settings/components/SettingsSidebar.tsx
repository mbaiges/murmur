import React from 'react'
import type { MurmurState } from '@core/domain/types'
import type { SettingsTab } from '../types'

type SettingsSidebarProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  onRefresh: () => void
  isRefreshing: boolean
  state: MurmurState | null
}

export default function SettingsSidebar({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  state
}: SettingsSidebarProps) {
  const tabClass = (tab: SettingsTab) =>
    `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      activeTab === tab
        ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
      <div className="space-y-8">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Murmur</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Windows Desktop App</p>
          </div>
          <img src="./logo.png" className="h-10 w-10 object-contain rounded-lg border border-slate-800 p-1 bg-slate-955" alt="" />
        </div>

        <nav className="space-y-1">
          <button type="button" onClick={() => onTabChange('feeds')} className={tabClass('feeds')}>
            <span>Ingestion & Feeds</span>
          </button>
          <button type="button" onClick={() => onTabChange('moods')} className={tabClass('moods')}>
            <span>Aesthetic Moods</span>
          </button>
          <button type="button" onClick={() => onTabChange('appearance')} className={tabClass('appearance')}>
            <span>Appearance</span>
          </button>
          <button type="button" onClick={() => onTabChange('monitors')} className={tabClass('monitors')}>
            <span>Monitors</span>
          </button>
          <button type="button" onClick={() => onTabChange('history')} className={tabClass('history')}>
            <span>Phrase History</span>
          </button>
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
            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
