import React, { useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../../app/AppShell'
import SetupWizard from './components/SetupWizard'
import SettingsSidebar from './components/SettingsSidebar'
import SettingsApplyBar from './components/SettingsApplyBar'
import GeneralTab from './tabs/GeneralTab'
import NewsSourcesTab from './tabs/NewsSourcesTab'
import VoiceTab from './tabs/VoiceTab'
import StyleTab from './tabs/StyleTab'
import HistoryTab from './tabs/HistoryTab'
import { useMurmurConfig, readSettingsUiState, writeSettingsUiState } from './hooks/useMurmurConfig'
import { useSettingsDraft } from './hooks/useSettingsDraft'
import { usePrimaryDisplaySize } from './hooks/usePrimaryDisplaySize'
import { useScopedMonitorSave } from './hooks/useScopedMonitorSave'
import { getWindowApi } from './hooks/getWindowApi'
import { createMonitorConfig, getMonitorEntry } from '@core/lib/config/monitorProfiles'
import { getDefaultMonitorProfile } from '@core/lib/config/defaultMonitorProfile'
import { isSyncAllTabs } from '@core/lib/config/monitorProfiles'
import type { SettingsTab, SettingsUiState } from './types'

const WIZARD_FLAG = 'murmur.wizardJustCompleted'

function loadUiState(): SettingsUiState {
  const stored = readSettingsUiState()
  const storedTab = stored?.activeTab ?? 'general'
  const activeTab: SettingsTab =
    storedTab === 'displays' ? 'history' : (storedTab as SettingsTab)
  return {
    activeTab: sessionStorage.getItem(WIZARD_FLAG) ? 'general' : activeTab,
    scrollByTab: stored?.scrollByTab ?? {},
    selectedMonitorId: stored?.selectedMonitorId
  }
}

export default function SettingsShell() {
  const { config, state, setState, toast, showToast, saveConfig } = useMurmurConfig()
  const [uiState, setUiState] = useState(loadUiState)
  const [screenIds, setScreenIds] = useState<string[]>([])

  const persistUi = (patch: Partial<SettingsUiState>) => {
    setUiState((prev) => {
      const next = { ...prev, ...patch }
      writeSettingsUiState(next)
      return next
    })
  }

  const selectedMonitorId = uiState.selectedMonitorId ?? screenIds[0] ?? config?.monitors[0]?.id ?? ''

  const {
    draft,
    isDirty,
    isApplying,
    patchDraft,
    applyMoodToDraft,
    applyDraft,
    resetDraft,
    handlePromptPresetChange
  } = useSettingsDraft({ committed: config, monitorId: selectedMonitorId, showToast })

  const { saveProfilePatch, saveSyncFlag } = useScopedMonitorSave(config, saveConfig)
  const displaySize = usePrimaryDisplaySize()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const api = getWindowApi()
    if (!api) return
    void api.getScreens().then((screens) => {
      setScreenIds(screens.map((s) => s.id))
    })
  }, [])

  useEffect(() => {
    const api = getWindowApi()
    if (!api) return
    void api.getScreens().then((screens) => {
      setScreenIds(screens.map((s) => s.id))
    })
  }, [state?.lastRefreshTime, state?.lastPhrases])

  const displayOptions = useMemo(() => {
    if (screenIds.length > 0) {
      return screenIds.map((id, i) => ({ id, label: `Display ${i + 1}` }))
    }
    if (config?.monitors.length) {
      return config.monitors.map((m, i) => ({ id: m.id, label: `Display ${i + 1}` }))
    }
    const ids = Object.keys(state?.lastPhrases ?? {})
    return ids.map((id, i) => ({ id, label: `Display ${i + 1}` }))
  }, [screenIds, state?.lastPhrases, config?.monitors])

  useEffect(() => {
    if (!selectedMonitorId && displayOptions[0]) {
      persistUi({ selectedMonitorId: displayOptions[0].id })
      return
    }
    if (
      selectedMonitorId &&
      displayOptions.length > 0 &&
      !displayOptions.some((d) => d.id === selectedMonitorId)
    ) {
      persistUi({ selectedMonitorId: displayOptions[0].id })
    }
  }, [displayOptions, selectedMonitorId])

  useEffect(() => {
    const top = uiState.scrollByTab[uiState.activeTab]
    if (scrollRef.current && top != null) {
      scrollRef.current.scrollTop = top
    }
  }, [uiState.activeTab])

  const handleTabChange = (tab: SettingsTab) => {
    if (scrollRef.current) {
      persistUi({
        activeTab: tab,
        scrollByTab: { ...uiState.scrollByTab, [uiState.activeTab]: scrollRef.current.scrollTop }
      })
    } else {
      persistUi({ activeTab: tab })
    }
  }

  const handleMainScroll = () => {
    if (!scrollRef.current) return
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current)
    scrollSaveTimer.current = setTimeout(() => {
      persistUi({
        scrollByTab: { ...uiState.scrollByTab, [uiState.activeTab]: scrollRef.current!.scrollTop }
      })
    }, 200)
  }

  const handleRefresh = async () => {
    const api = getWindowApi()
    if (!api || isRefreshing) return
    setIsRefreshing(true)
    showToast('Ingesting RSS feeds and generating wallpapers...')
    try {
      await api.refreshWallpaper()
      const freshState = await api.getState()
      setState(freshState)
      const screens = await api.getScreens()
      setScreenIds(screens.map((s) => s.id))
      showToast('Wallpapers refreshed successfully!')
    } catch (err: unknown) {
      console.error(err)
      showToast('Refresh failed. Check your API key and Internet.', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleWizardSubmit = async (geminiApiKey: string, feedUrl: string) => {
    if (!geminiApiKey) {
      showToast('Please enter a valid Gemini API Key', 'error')
      return
    }
    const profile = getDefaultMonitorProfile({ feeds: [feedUrl] })
    await saveConfig({
      geminiApiKey,
      monitors: [createMonitorConfig('primary', profile)]
    })
    sessionStorage.setItem(WIZARD_FLAG, '1')
    persistUi({ activeTab: 'general' })
    showToast('Settings saved successfully. Pick a look in Style when you’re ready.')
  }

  useEffect(() => {
    if (sessionStorage.getItem(WIZARD_FLAG) && config?.geminiApiKey) {
      sessionStorage.removeItem(WIZARD_FLAG)
    }
  }, [config?.geminiApiKey])

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (!config.geminiApiKey) {
    return <SetupWizard toast={toast} onSubmit={handleWizardSubmit} />
  }

  const selectedMonitor = getMonitorEntry(config, selectedMonitorId)
  const profileDraft = draft
  const showApplyBar = isDirty
  const showSyncControls = displayOptions.length > 1

  const previewPhrase =
    state?.lastContent?.[selectedMonitorId]?.payload?.phrase ??
    state?.lastPhrases?.[selectedMonitorId] ??
    ''
  const previewLayoutEnvelope = state?.lastContent?.[selectedMonitorId] ?? null

  const handleSyncAllTabs = () => {
    if (!selectedMonitor) return
    void saveSyncFlag(selectedMonitorId, 'all', !isSyncAllTabs(selectedMonitor))
  }

  return (
    <>
      <AppShell
        toast={toast}
        sidebar={
          <SettingsSidebar
            activeTab={uiState.activeTab}
            onTabChange={handleTabChange}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            state={state}
            hasDraftPending={isDirty}
            displayOptions={displayOptions}
            selectedMonitorId={selectedMonitorId}
            onMonitorChange={(id) => persistUi({ selectedMonitorId: id })}
            selectedMonitor={selectedMonitor}
            onSyncAllTabsToggle={handleSyncAllTabs}
          />
        }
        mainScrollRef={scrollRef}
        onMainScroll={handleMainScroll}
      >
        {uiState.activeTab === 'general' && (
          <GeneralTab config={config} state={state} saveConfig={saveConfig} />
        )}
        {uiState.activeTab === 'news' && selectedMonitor && (
          <NewsSourcesTab
            feeds={selectedMonitor.profile.feeds}
            syncNews={selectedMonitor.syncNews}
            showSyncChip={showSyncControls}
            onSyncToggle={() =>
              void saveSyncFlag(selectedMonitorId, 'news', !selectedMonitor.syncNews)
            }
            onFeedsChange={(feeds) => void saveProfilePatch(selectedMonitorId, 'news', { feeds })}
          />
        )}
        {uiState.activeTab === 'voice' && profileDraft && (
          <VoiceTab
            config={profileDraft}
            syncVoice={selectedMonitor?.syncVoice ?? true}
            showSyncChip={showSyncControls}
            onSyncToggle={() =>
              selectedMonitor &&
              void saveSyncFlag(selectedMonitorId, 'voice', !selectedMonitor.syncVoice)
            }
            patchDraft={patchDraft}
            onPresetChange={handlePromptPresetChange}
          />
        )}
        {uiState.activeTab === 'style' && profileDraft && (
          <StyleTab
            config={profileDraft}
            syncStyle={selectedMonitor?.syncStyle ?? true}
            showSyncChip={showSyncControls}
            onSyncToggle={() =>
              selectedMonitor &&
              void saveSyncFlag(selectedMonitorId, 'style', !selectedMonitor.syncStyle)
            }
            patchDraft={patchDraft}
            onMoodChange={applyMoodToDraft}
            previewPhrase={previewPhrase}
            previewLayoutEnvelope={previewLayoutEnvelope}
            displayWidth={displaySize.width}
            displayHeight={displaySize.height}
            scrollContainerRef={scrollRef}
          />
        )}
        {uiState.activeTab === 'history' && (
          <HistoryTab config={config} selectedMonitorId={selectedMonitorId} />
        )}
      </AppShell>
      {showApplyBar && (
        <SettingsApplyBar onApply={() => void applyDraft()} onReset={resetDraft} isApplying={isApplying} />
      )}
    </>
  )
}
