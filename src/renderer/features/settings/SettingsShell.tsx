import React, { useEffect, useState } from 'react'
import type { ThemeName } from '@core/domain/types'
import AppShell from '../../app/AppShell'
import MoodsTab from '../moods/MoodsTab'
import SetupWizard from './components/SetupWizard'
import SettingsSidebar from './components/SettingsSidebar'
import FeedsTab from './tabs/FeedsTab'
import AppearanceTab from './tabs/AppearanceTab'
import MonitorsTab from './tabs/MonitorsTab'
import HistoryTab from './tabs/HistoryTab'
import { useMurmurConfig } from './hooks/useMurmurConfig'
import { useSystemPromptDraft } from './hooks/useSystemPromptDraft'
import { useMoodChange } from './hooks/useMoodChange'
import { getWindowApi } from './hooks/getWindowApi'
import type { SettingsTab } from './types'

export default function SettingsShell() {
  const { config, state, setState, toast, showToast, saveConfig } = useMurmurConfig()
  const promptDraft = useSystemPromptDraft(config, saveConfig)
  const handleMoodChange = useMoodChange(saveConfig, promptDraft.syncDraftFromPrompt)

  const [activeTab, setActiveTab] = useState<SettingsTab>('feeds')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [historyMonitorId, setHistoryMonitorId] = useState('')
  const [historyPhrases, setHistoryPhrases] = useState<string[]>([])
  const [historyViewMode, setHistoryViewMode] = useState<'preview' | 'raw'>('preview')

  useEffect(() => {
    const api = getWindowApi()
    if (api && historyMonitorId && activeTab === 'history') {
      api.getHistory(historyMonitorId).then(setHistoryPhrases).catch(console.error)
    }
  }, [historyMonitorId, activeTab])

  useEffect(() => {
    if (state && Object.keys(state.lastPhrases).length > 0 && !historyMonitorId) {
      setHistoryMonitorId(Object.keys(state.lastPhrases)[0])
    }
  }, [state, historyMonitorId])

  const handleRefresh = async () => {
    const api = getWindowApi()
    if (!api || isRefreshing) return
    setIsRefreshing(true)
    showToast('Ingesting RSS feeds and generating wallpapers...')
    try {
      await api.refreshWallpaper()
      const freshState = await api.getState()
      setState(freshState)
      showToast('Wallpapers refreshed successfully!')
    } catch (err: unknown) {
      console.error(err)
      showToast('Refresh failed. Check your API key and Internet.', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePreviewTheme = async (monitorId: string, theme: ThemeName) => {
    const api = getWindowApi()
    if (!api) return
    showToast(`Applying preview for theme: ${theme}...`)
    try {
      await api.previewTheme(monitorId, theme)
      showToast('Preview applied successfully')
    } catch (err: unknown) {
      console.error(err)
      showToast('Failed to apply preview', 'error')
    }
  }

  const handleClearHistory = async (monitorId: string) => {
    const api = getWindowApi()
    if (!api) return
    try {
      await api.clearHistory(monitorId)
      setHistoryPhrases([])
      showToast('History logs cleared')
    } catch (err) {
      console.error(err)
    }
  }

  const handleWizardSubmit = async (geminiApiKey: string, feedUrl: string) => {
    if (!geminiApiKey) {
      showToast('Please enter a valid Gemini API Key', 'error')
      return
    }
    await saveConfig({
      geminiApiKey,
      feeds: [feedUrl]
    })
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!config.geminiApiKey) {
    return <SetupWizard toast={toast} onSubmit={handleWizardSubmit} />
  }

  return (
    <AppShell
      toast={toast}
      sidebar={
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          state={state}
        />
      }
    >
      {activeTab === 'moods' && <MoodsTab config={config} onMoodChange={handleMoodChange} />}

      {activeTab === 'feeds' && (
        <FeedsTab
          config={config}
          saveConfig={saveConfig}
          draftPrompt={promptDraft.draftPrompt}
          isPromptDirty={promptDraft.isPromptDirty}
          isApplyingPrompt={promptDraft.isApplyingPrompt}
          showCheckmark={promptDraft.showCheckmark}
          onPromptChange={promptDraft.handlePromptChange}
          onApplyPrompt={promptDraft.handleApplyPrompt}
          onPresetChange={promptDraft.handlePresetChange}
        />
      )}

      {activeTab === 'appearance' && (
        <AppearanceTab config={config} saveConfig={saveConfig} onMoodChange={handleMoodChange} />
      )}

      {activeTab === 'monitors' && (
        <MonitorsTab
          config={config}
          state={state}
          saveConfig={saveConfig}
          onPreviewTheme={handlePreviewTheme}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          config={config}
          state={state}
          historyMonitorId={historyMonitorId}
          setHistoryMonitorId={setHistoryMonitorId}
          historyPhrases={historyPhrases}
          historyViewMode={historyViewMode}
          setHistoryViewMode={setHistoryViewMode}
          onClearHistory={handleClearHistory}
        />
      )}
    </AppShell>
  )
}
