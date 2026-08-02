import React, { useEffect, useRef, useState } from 'react'
import AppShell from '../../app/AppShell'
import SetupWizard from './components/SetupWizard'
import SettingsSidebar from './components/SettingsSidebar'
import SettingsApplyBar from './components/SettingsApplyBar'
import GeneralTab from './tabs/GeneralTab'
import NewsSourcesTab from './tabs/NewsSourcesTab'
import VoiceTab from './tabs/VoiceTab'
import StyleTab from './tabs/StyleTab'
import DisplaysTab from './tabs/DisplaysTab'
import { useMurmurConfig, readSettingsUiState, writeSettingsUiState } from './hooks/useMurmurConfig'
import { useSettingsDraft } from './hooks/useSettingsDraft'
import { usePrimaryDisplaySize } from './hooks/usePrimaryDisplaySize'
import { getWindowApi } from './hooks/getWindowApi'
import type { DisplaysSection, SettingsTab, SettingsUiState } from './types'

const WIZARD_FLAG = 'murmur.wizardJustCompleted'

function loadUiState(): SettingsUiState {
  const stored = readSettingsUiState()
  return {
    activeTab: sessionStorage.getItem(WIZARD_FLAG) ? 'general' : (stored?.activeTab ?? 'general'),
    displaysSection: stored?.displaysSection ?? 'monitors',
    scrollByTab: stored?.scrollByTab ?? {},
  }
}

export default function SettingsShell() {
  const { config, state, setState, toast, showToast, saveConfig } = useMurmurConfig()
  const {
    draft,
    isDirty,
    isApplying,
    patchDraft,
    applyMoodToDraft,
    applyDraft,
    resetDraft,
    handlePromptPresetChange
  } = useSettingsDraft({ committed: config, showToast })

  const displaySize = usePrimaryDisplaySize()

  const [uiState, setUiState] = useState(loadUiState)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistUi = (patch: Partial<SettingsUiState>) => {
    setUiState((prev) => {
      const next = { ...prev, ...patch }
      writeSettingsUiState(next)
      return next
    })
  }

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
      showToast('Wallpapers refreshed successfully!')
    } catch (err: unknown) {
      console.error(err)
      showToast('Refresh failed. Check your API key and Internet.', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePreviewTheme = async (monitorId: string, theme: import('@core/domain/types').ThemeName) => {
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

  const handleWizardSubmit = async (geminiApiKey: string, feedUrl: string) => {
    if (!geminiApiKey) {
      showToast('Please enter a valid Gemini API Key', 'error')
      return
    }
    await saveConfig({ geminiApiKey, feeds: [feedUrl] })
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

  const draftConfig = draft ?? config
  const showApplyBar = isDirty

  const previewPhrase =
    state?.lastPhrases &&
    (Object.values(state.lastPhrases).find((p) => p && p.trim()) as string | undefined)

  const previewLayoutEnvelope =
    state?.lastContent &&
    (Object.values(state.lastContent).find((e) => e?.payload) as
      | import('@core/domain/types').LayoutContentEnvelope
      | undefined)

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
          />
        }
        mainScrollRef={scrollRef}
        onMainScroll={handleMainScroll}
      >
        {uiState.activeTab === 'general' && (
          <GeneralTab config={config} state={state} saveConfig={saveConfig} />
        )}
        {uiState.activeTab === 'news' && <NewsSourcesTab config={config} saveConfig={saveConfig} />}
        {uiState.activeTab === 'voice' && (
          <VoiceTab config={draftConfig} patchDraft={patchDraft} onPresetChange={handlePromptPresetChange} />
        )}
        {uiState.activeTab === 'style' && (
          <StyleTab
            config={draftConfig}
            patchDraft={patchDraft}
            onMoodChange={applyMoodToDraft}
            previewPhrase={previewPhrase ?? ''}
            previewLayoutEnvelope={previewLayoutEnvelope ?? null}
            displayWidth={displaySize.width}
            displayHeight={displaySize.height}
            scrollContainerRef={scrollRef}
          />
        )}
        {uiState.activeTab === 'displays' && (
          <DisplaysTab
            config={config}
            state={state}
            saveConfig={saveConfig}
            onPreviewTheme={handlePreviewTheme}
            section={uiState.displaysSection}
            onSectionChange={(s) => persistUi({ displaysSection: s })}
          />
        )}
      </AppShell>
      {showApplyBar && (
        <SettingsApplyBar onApply={() => void applyDraft()} onReset={resetDraft} isApplying={isApplying} />
      )}
    </>
  )
}
