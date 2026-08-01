import React, { useState, useEffect } from 'react'
import { MurmurConfig, MurmurState, ThemeName, DEFAULT_SYSTEM_PROMPT, ABSURD_PROVERB_PROMPT, WORST_NEWS_TITLE_PROMPT, BEST_NEWS_TITLE_PROMPT, CYBERPUNK_TERMINAL_PROMPT, ZEN_KOAN_PROMPT, PARANOID_CONSPIRACY_PROMPT, EXISTENTIAL_DREAD_PROMPT, GOTHIC_PURPLE_PROSE_PROMPT } from '../domain/types'
import { phraseToPlainText } from '../shared/phrasePlainText'
import {
  MOOD_LINKED_PROMPT_PRESETS,
  STANDALONE_PROMPT_PRESETS,
  presetIdToPrompt,
  promptToPresetId
} from '../shared/promptPresets'
import WallpaperView from './WallpaperView'
import MoodsTab from './components/MoodsTab'

// Type cast helper for electron window API
const api = (window as any).api

export default function App() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<MurmurState | null>(null)
  const [activeTab, setActiveTab] = useState<'feeds' | 'appearance' | 'monitors' | 'history' | 'moods'>('feeds')
  const [newFeed, setNewFeed] = useState('')
  const [historyMonitorId, setHistoryMonitorId] = useState<string>('')
  const [historyPhrases, setHistoryPhrases] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Draft system prompt and apply states
  const [draftPrompt, setDraftPrompt] = useState<string>('')
  const [isPromptDirty, setIsPromptDirty] = useState<boolean>(false)
  const [isApplyingPrompt, setIsApplyingPrompt] = useState<boolean>(false)
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false)

  // Setup Wizard fields
  const [wizardKey, setWizardKey] = useState('')
  const [wizardFeed, setWizardFeed] = useState('https://feeds.bbci.co.uk/news/rss.xml')

  // Check if we should render the Wallpaper view instead of the Dashboard
  const params = new URLSearchParams(window.location.search)
  const isWallpaperView = params.get('view') === 'wallpaper'

  useEffect(() => {
    // 1. Fetch initial config and state
    if (api) {
      api.getConfig().then(setConfig).catch(console.error)
      api.getState().then(setState).catch(console.error)

      // 2. Listen to live state updates
      const removeStateListener = api.onStateUpdated((updatedState: MurmurState) => {
        setState(updatedState)
      })

      // 3. Listen to live config updates
      const removeConfigListener = api.onConfigUpdated((updatedConfig: MurmurConfig) => {
        setConfig(updatedConfig)
      })

      return () => {
        removeStateListener()
        removeConfigListener()
      }
    }
  }, [])

  // Auto-fetch history when active monitor changes
  useEffect(() => {
    if (api && historyMonitorId) {
      api.getHistory(historyMonitorId).then(setHistoryPhrases).catch(console.error)
    }
  }, [historyMonitorId])

  // Setup default monitor selection for history tab
  useEffect(() => {
    if (state && Object.keys(state.lastPhrases).length > 0 && !historyMonitorId) {
      setHistoryMonitorId(Object.keys(state.lastPhrases)[0])
    }
  }, [state, historyMonitorId])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (updatedConfig: Partial<MurmurConfig>) => {
    if (!api || !config) return
    try {
      await api.saveConfig(updatedConfig)
      const fresh = await api.getConfig()
      setConfig(fresh)
      showToast('Settings saved successfully')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to save settings', 'error')
    }
  }

  // Sync draft prompt when config is loaded or updated externally
  useEffect(() => {
    if (config) {
      setDraftPrompt(config.systemPrompt)
      setIsPromptDirty(false)
    }
  }, [config?.systemPrompt])

  const handlePromptChange = (val: string) => {
    setDraftPrompt(val)
    setIsPromptDirty(val !== config?.systemPrompt)
  }

  const handleApplyPrompt = async () => {
    if (isApplyingPrompt) return
    setIsApplyingPrompt(true)
    try {
      await handleSave({ systemPrompt: draftPrompt })
      setIsPromptDirty(false)
      setShowCheckmark(true)
      setTimeout(() => {
        setShowCheckmark(false)
      }, 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setIsApplyingPrompt(false)
    }
  }

  const handlePresetChange = (presetName: string) => {
    const nextPrompt = presetIdToPrompt(presetName)
    if (!nextPrompt) return

    setDraftPrompt(nextPrompt)
    setIsPromptDirty(false)
    handleSave({ systemPrompt: nextPrompt })
  }

  const handleMoodChange = (moodName: string) => {
    if (moodName === 'Custom') return
    
    let updates: Partial<MurmurConfig> = {}
    if (moodName === 'Rogue Terminal') {
      updates = {
        systemPrompt: CYBERPUNK_TERMINAL_PROMPT,
        theme: 'Cyberpunk',
        fontFamily: 'Monospace',
        layoutStyle: 'editorial-left',
        animation: 'Typewriter',
        audioFeedback: true,
        vignetteStyle: 'dramatic',
        noiseIntensity: 'heavy',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: true,
        enableNewlines: true
      }
    } else if (moodName === 'Zen Study') {
      updates = {
        systemPrompt: ZEN_KOAN_PROMPT,
        theme: 'Parchment',
        fontFamily: 'EB Garamond',
        layoutStyle: 'book-cover',
        animation: 'Fade',
        audioFeedback: false,
        vignetteStyle: 'soft',
        noiseIntensity: 'subtle',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: true,
        enableNewlines: true
      }
    } else if (moodName === 'Gothic Novelist') {
      updates = {
        systemPrompt: GOTHIC_PURPLE_PROSE_PROMPT,
        theme: 'Drift',
        fontFamily: 'Playfair Display',
        layoutStyle: 'asymmetrical',
        animation: 'DriftIn',
        audioFeedback: false,
        vignetteStyle: 'dramatic',
        noiseIntensity: 'subtle',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: true,
        enableNewlines: true
      }
    } else if (moodName === 'Clickbait Press') {
      updates = {
        systemPrompt: WORST_NEWS_TITLE_PROMPT,
        theme: 'Crimson',
        fontFamily: 'Outfit',
        layoutStyle: 'centered',
        animation: 'Fade',
        audioFeedback: false,
        vignetteStyle: 'none',
        noiseIntensity: 'none',
        enableBold: true,
        enableItalic: true,
        enableDifferentFonts: true,
        enableNewlines: true
      }
    }
    
    if (updates.systemPrompt) {
      setDraftPrompt(updates.systemPrompt)
      setIsPromptDirty(false)
    }
    handleSave(updates)
  }

  const handleRefresh = async () => {
    if (!api || isRefreshing) return
    setIsRefreshing(true)
    showToast('Ingesting RSS feeds and generating wallpapers...')
    try {
      await api.refreshWallpaper()
      const freshState = await api.getState()
      setState(freshState)
      showToast('Wallpapers refreshed successfully!')
    } catch (err: any) {
      console.error(err)
      showToast('Refresh failed. Check your API key and Internet.', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePreviewTheme = async (monitorId: string, theme: ThemeName) => {
    if (!api) return
    showToast(`Applying preview for theme: ${theme}...`)
    try {
      await api.previewTheme(monitorId, theme)
      showToast('Preview applied successfully')
    } catch (err: any) {
      console.error(err)
      showToast('Failed to apply preview', 'error')
    }
  }

  const handleClearHistory = async (monitorId: string) => {
    if (!api) return
    try {
      await api.clearHistory(monitorId)
      setHistoryPhrases([])
      showToast('History logs cleared')
    } catch (err) {
      console.error(err)
    }
  }

  const handleStartWizard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wizardKey.trim()) {
      showToast('Please enter a valid Gemini API Key', 'error')
      return
    }
    await handleSave({
      geminiApiKey: wizardKey.trim(),
      feeds: [wizardFeed.trim()]
    })
  }

  if (isWallpaperView) {
    return <WallpaperView />
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // --- 1. SETUP WIZARD VIEW ---
  if (!config.geminiApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
        {toast && (
          <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300 z-50 border ${
            toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'
          }`}>
            {toast.message}
          </div>
        )}
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="flex items-center space-x-3 mb-6">
            <img src="/logo.png" className="h-10 w-10 object-contain rounded-lg border border-slate-800 p-1 bg-slate-955" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Murmur</h1>
              <p className="text-xs text-slate-400">First-time Setup Wizard</p>
            </div>
          </div>

          <form onSubmit={handleStartWizard} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
              <input
                type="password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-700 outline-none transition-all"
                placeholder="AIzaSy..."
                value={wizardKey}
                onChange={(e) => setWizardKey(e.target.value)}
              />
              <p className="text-slate-500 text-xs mt-1">Get a free key from Google AI Studio / Gemini Playground.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First RSS Feed URL</label>
              <input
                type="url"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                value={wizardFeed}
                onChange={(e) => setWizardFeed(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg font-semibold text-sm text-white shadow-lg transition-colors"
            >
              Start Murmur
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- 2. MAIN DASHBOARD VIEW ---
  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Draggable Custom Header */}
      <header
        className={`h-10 bg-slate-950 flex items-center justify-between select-none border-b border-slate-900 titlebar-drag ${
          (window as any).api?.platform === 'darwin' ? 'pl-[76px] pr-6' : 'px-6'
        }`}
      >
        <div className="flex items-center space-x-2">
          <img src="/logo.png" className="h-4 w-4 object-contain rounded p-[1px] bg-slate-800" />
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Murmur Settings</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-12 right-6 px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300 z-50 border ${
            toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
          <div className="space-y-8">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Murmur</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Windows Desktop App</p>
              </div>
              <img src="/logo.png" className="h-10 w-10 object-contain rounded-lg border border-slate-800 p-1 bg-slate-955" />
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('feeds')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'feeds' ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Ingestion & Feeds</span>
              </button>
              
              <button
                onClick={() => setActiveTab('moods')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'moods' ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Aesthetic Moods</span>
              </button>
              
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'appearance' ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Appearance</span>
              </button>

              <button
                onClick={() => setActiveTab('monitors')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'monitors' ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Monitors</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history' ? 'bg-indigo-950 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Phrase History</span>
              </button>
            </nav>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-xs text-white shadow-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isRefreshing && <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
            </button>
            
            <div className="text-[10px] text-slate-500 leading-normal text-center">
              {state?.lastRefreshTime ? `Last update: ${state.lastRefreshTime}` : 'Idle'}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-10">
          
          {/* TAB: MOODS */}
          {activeTab === 'moods' && (
            <MoodsTab config={config} onMoodChange={handleMoodChange} />
          )}

          {/* TAB 1: FEEDS */}
          {activeTab === 'feeds' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Ingestion & Feeds</h2>
                <p className="text-slate-400 text-sm">Configure Gemini keys, RSS sources, and customize the AI generation prompt.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                {/* API Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none transition-all"
                    value={config.geminiApiKey}
                    onChange={(e) => handleSave({ geminiApiKey: e.target.value })}
                    placeholder="Enter your API Key"
                  />
                </div>

                {/* AI System Prompt */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">AI System Prompt Preset</label>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center space-x-2">
                        <select
                          className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none transition-all cursor-pointer max-w-[220px]"
                          value={promptToPresetId(draftPrompt)}
                          onChange={(e) => handlePresetChange(e.target.value)}
                        >
                          <optgroup label="Linked to Aesthetic Moods">
                            {MOOD_LINKED_PROMPT_PRESETS.map((preset) => (
                              <option key={preset.id} value={preset.id}>
                                {preset.label} — {preset.moodName}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Prompt only (no mood)">
                            {STANDALONE_PROMPT_PRESETS.map((preset) => (
                              <option key={preset.id} value={preset.id}>
                                {preset.label}
                              </option>
                            ))}
                          </optgroup>
                          <option value="Custom">Custom (edited below)</option>
                        </select>

                        {(isPromptDirty || showCheckmark) && (
                          <button
                            onClick={handleApplyPrompt}
                            disabled={isApplyingPrompt}
                            className={`flex items-center space-x-1.5 px-2.5 py-1 text-[10px] rounded font-semibold text-white transition-all shadow-md active:scale-95 duration-150 ${
                              showCheckmark
                                ? 'bg-emerald-600 hover:bg-emerald-500'
                                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
                            } animate-fade-in`}
                          >
                            {isApplyingPrompt ? (
                              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : showCheckmark ? (
                              <svg className="h-3 w-3 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            <span>{isApplyingPrompt ? 'Applying...' : showCheckmark ? 'Applied!' : 'Apply'}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-[280px] leading-snug text-right">
                        Mood-linked prompts match Aesthetic Moods; prompt-only presets change the AI voice without switching theme or layout.
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-all font-mono leading-relaxed resize-y"
                    value={draftPrompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder="Enter system prompt guidelines..."
                  />
                </div>

                {/* Refresh Interval & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Refresh Interval</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.refreshIntervalMinutes}
                      onChange={(e) => handleSave({ refreshIntervalMinutes: Number(e.target.value) })}
                    >
                      <option value={15}>Every 15 minutes</option>
                      <option value={30}>Every 30 minutes</option>
                      <option value={60}>Every hour</option>
                      <option value={180}>Every 3 hours</option>
                      <option value={360}>Every 6 hours</option>
                      <option value={720}>Every 12 hours</option>
                      <option value={1440}>Every 24 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output Language</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.language}
                      onChange={(e) => handleSave({ language: e.target.value })}
                    >
                      <option value="auto">Auto (Match headlines)</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>
                </div>

                {/* Launch at Login */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium text-white">Launch at login</h4>
                    <p className="text-xs text-slate-500">Automatically run Murmur quietly in tray when starting Windows.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                    checked={config.launchAtLogin}
                    onChange={(e) => handleSave({ launchAtLogin: e.target.checked })}
                  />
                </div>
              </div>

              {/* RSS Feeds Management */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">RSS Sources</h3>
                  <p className="text-xs text-slate-400">Active URLs harvested to synthesize nonsense concepts.</p>
                </div>

                {/* Feed List */}
                <div className="space-y-2">
                  {config.feeds.map((feed, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200">
                      <span className="truncate pr-4">{feed}</span>
                      {config.feeds.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = config.feeds.filter((_, idx) => idx !== index)
                            handleSave({ feeds: updated })
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Feed */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newFeed.trim() || !newFeed.startsWith('http')) return
                    handleSave({ feeds: [...config.feeds, newFeed.trim()] })
                    setNewFeed('')
                  }}
                  className="flex space-x-3"
                >
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none transition-all"
                    value={newFeed}
                    onChange={(e) => setNewFeed(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg font-semibold text-xs text-white"
                  >
                    Add Feed
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Appearance</h2>
                <p className="text-slate-400 text-sm">Customize visual style, typography layout, text formatting, and vignette overlays.</p>
              </div>

              {/* Aesthetic Mood Presets */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Aesthetic Mood Preset</h3>
                  <p className="text-xs text-slate-400">Instantly configure coordinated prompt, theme, font, layout, and animation settings.</p>
                </div>
                <select
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all cursor-pointer"
                  value={
                    config.systemPrompt === CYBERPUNK_TERMINAL_PROMPT &&
                    config.theme === 'Cyberpunk' &&
                    config.fontFamily === 'Monospace' &&
                    config.layoutStyle === 'editorial-left' &&
                    config.animation === 'Typewriter' &&
                    config.audioFeedback === true &&
                    config.vignetteStyle === 'dramatic' &&
                    config.noiseIntensity === 'heavy'
                      ? 'Rogue Terminal'
                      : config.systemPrompt === ZEN_KOAN_PROMPT &&
                        config.theme === 'Parchment' &&
                        config.fontFamily === 'EB Garamond' &&
                        config.layoutStyle === 'book-cover' &&
                        config.animation === 'Fade' &&
                        config.audioFeedback === false &&
                        config.vignetteStyle === 'soft' &&
                        config.noiseIntensity === 'subtle'
                        ? 'Zen Study'
                        : config.systemPrompt === GOTHIC_PURPLE_PROSE_PROMPT &&
                          config.theme === 'Drift' &&
                          config.fontFamily === 'Playfair Display' &&
                          config.layoutStyle === 'asymmetrical' &&
                          config.animation === 'DriftIn' &&
                          config.audioFeedback === false &&
                          config.vignetteStyle === 'dramatic' &&
                          config.noiseIntensity === 'subtle'
                          ? 'Gothic Novelist'
                          : config.systemPrompt === WORST_NEWS_TITLE_PROMPT &&
                            config.theme === 'Crimson' &&
                            config.fontFamily === 'Outfit' &&
                            config.layoutStyle === 'centered' &&
                            config.animation === 'Fade' &&
                            config.audioFeedback === false &&
                            config.vignetteStyle === 'none' &&
                            config.noiseIntensity === 'none'
                            ? 'Clickbait Press'
                            : 'Custom'
                  }
                  onChange={(e) => handleMoodChange(e.target.value)}
                >
                  <option value="Custom">Custom (Manual adjustments)</option>
                  <option value="Rogue Terminal">🟢 Rogue Terminal (Cyberpunk Aesthetic)</option>
                  <option value="Zen Study">🪶 Zen Study (Minimalist Paper Aesthetic)</option>
                  <option value="Gothic Novelist">🌁 Gothic Novelist (Moody Literary Aesthetic)</option>
                  <option value="Clickbait Press">🚨 Clickbait Press (Satirical News Aesthetic)</option>
                </select>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                {/* Theme & Fonts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Default Theme</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.theme}
                      onChange={(e) => handleSave({ theme: e.target.value as ThemeName })}
                    >
                      <option value="Midnight">Midnight (Dark Indigo Gradient)</option>
                      <option value="Drift">Drift (Ocean Wave Gradient)</option>
                      <option value="Forest">Forest (Deep Emerald Gradient)</option>
                      <option value="Crimson">Crimson (Luxurious Blood Red)</option>
                      <option value="Cyberpunk">Cyberpunk (Neon Purple/Cyan)</option>
                      <option value="WarmGlow">Warm Glow (Sunset Gradients)</option>
                      <option value="Parchment">Parchment (Warm Tan Paper)</option>
                      <option value="Blanc">Blanc (Minimalist Off-White)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Typography Font</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.fontFamily}
                      onChange={(e) => handleSave({ fontFamily: e.target.value as any })}
                    >
                      <option value="EB Garamond">EB Garamond (Elegant Serif)</option>
                      <option value="Garamond Bold">Garamond Bold (Extra Heavy Editorial)</option>
                      <option value="Playfair Display">Playfair Display (Poetic Serif)</option>
                      <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                      <option value="Monospace">Monospace (Terminal Code)</option>
                    </select>
                  </div>
                </div>

                {/* Transition Animations & Audio */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transition Animation</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.animation}
                      onChange={(e) => handleSave({ animation: e.target.value as any })}
                    >
                      <option value="Fade">Fade In</option>
                      <option value="DriftIn">Drift & Fade</option>
                      <option value="Morph">Morph (Scale & Fade)</option>
                      <option value="Typewriter">Typewriter Reveal</option>
                      <option value="Glitch">Glitch (Scrambled Neon)</option>
                      <option value="Instant">Instant Cut</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-6">
                    <div>
                      <h5 className="text-sm font-medium text-white">Keyboard Audio Feedback</h5>
                      <p className="text-xs text-slate-500">Undertale typewriter sounds.</p>
                    </div>
                    <input
                      type="checkbox"
                      disabled={config.animation !== 'Typewriter'}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 disabled:opacity-50"
                      checked={config.audioFeedback}
                      onChange={(e) => handleSave({ audioFeedback: e.target.checked })}
                    />
                  </div>
                </div>

                {/* Text Layout & Alignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Text Alignment</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.textAlignment}
                      onChange={(e) => handleSave({ textAlignment: e.target.value as any })}
                    >
                      <option value="center">Centered</option>
                      <option value="left">Left Aligned</option>
                      <option value="right">Right Aligned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Layout Style</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.layoutStyle}
                      onChange={(e) => handleSave({ layoutStyle: e.target.value as any })}
                    >
                      <optgroup label="Classic">
                        <option value="centered">Classic Centered</option>
                        <option value="editorial-left">Editorial Left Column</option>
                        <option value="editorial-right">Editorial Right Column</option>
                        <option value="asymmetrical">Asymmetrical Alternating</option>
                        <option value="book-cover">Editorial Book Cover</option>
                        <option value="scattered">Scattered Letters / Words</option>
                      </optgroup>
                      <optgroup label="Magazine &amp; news">
                        <option value="split-spread">Split Spread (left / right halves)</option>
                        <option value="tabloid-stack">Tabloid Stack (headline + deck)</option>
                        <option value="pull-quote">Pull Quote (oversized margin quote)</option>
                      </optgroup>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      Magazine layouts use editorial grids: split spread mirrors a two-page headline, tabloid stack separates
                      display line from standfirst, pull quote emphasizes one line like a feature break.
                    </p>
                  </div>
                  </div>

                {/* AI phrase formatting (Gemini + wallpaper markup) */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phrase Formatting</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose which markup the AI may use. Changing these regenerates the phrase for the current headlines.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Bold emphasis</h5>
                      <p className="text-xs text-slate-500">Allow **bold** markers in generated phrases.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableBold}
                      onChange={(e) => handleSave({ enableBold: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Italic emphasis</h5>
                      <p className="text-xs text-slate-500">Allow *italic* markers in generated phrases.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableItalic}
                      onChange={(e) => handleSave({ enableItalic: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Multi-line layout</h5>
                      <p className="text-xs text-slate-500">Allow line breaks for poetic multi-line phrases.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableNewlines}
                      onChange={(e) => handleSave({ enableNewlines: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Mixed fonts</h5>
                      <p className="text-xs text-slate-500">Allow [font:…] tags for accent typography.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableDifferentFonts}
                      onChange={(e) => handleSave({ enableDifferentFonts: e.target.checked })}
                    />
                  </div>
                </div>

                {/* Background Filters */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Grain / Noise Intensity</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.noiseIntensity}
                      onChange={(e) => handleSave({ noiseIntensity: e.target.value as any })}
                    >
                      <option value="none">None (Clean Background)</option>
                      <option value="subtle">Subtle Grain (Atmospheric)</option>
                      <option value="heavy">Heavy Grain (Analog Film)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vignette Style</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={config.vignetteStyle}
                      onChange={(e) => handleSave({ vignetteStyle: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      <option value="soft">Soft Vignette</option>
                      <option value="medium">Medium Vignette</option>
                      <option value="dramatic">Dramatic Vignette</option>
                    </select>
                  </div>
                </div>

                {/* Overlays */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallpaper Overlays</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Date & Time</h5>
                      <p className="text-xs text-slate-500">Render current local date/time in the corner.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.overlays.dateTime}
                      onChange={(e) => handleSave({
                        overlays: { ...config.overlays, dateTime: e.target.checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Source Credits</h5>
                      <p className="text-xs text-slate-500">Render list of news sources in the bottom-right corner.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.overlays.sourceCredit}
                      onChange={(e) => handleSave({
                        overlays: { ...config.overlays, sourceCredit: e.target.checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Concepts Sampled</h5>
                      <p className="text-xs text-slate-500">Render list of source headlines in the bottom-left corner.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.overlays.inspiringHeadlines}
                      onChange={(e) => handleSave({
                        overlays: { ...config.overlays, inspiringHeadlines: e.target.checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MONITORS */}
          {activeTab === 'monitors' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Monitors</h2>
                <p className="text-slate-400 text-sm">Manage configuration settings and theme overrides individually per display.</p>
              </div>

              {/* Monitor Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {state && Object.keys(state.lastPhrases).length > 0 ? (
                  Object.entries(state.lastPhrases).map(([monitorId, phrase], index) => {
                    const mConf = config.monitors.find(m => m.id === monitorId)
                    const enabled = mConf ? mConf.enabled : true
                    const currentTheme = mConf?.themeOverride || config.theme

                    return (
                      <div key={monitorId} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-semibold text-white">Display {index + 1}</h4>
                            <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded font-mono truncate max-w-[120px]">
                              ID: {monitorId}
                            </span>
                          </div>

                          <div className="bg-slate-955 border border-slate-800 rounded-lg p-3 text-xs italic text-slate-400 min-h-[60px] flex items-center justify-center text-center">
                            "{phrase ? phraseToPlainText(phrase) : 'No phrase generated yet'}"
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-855 col-span-1">
                          {/* Enable Toggle */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Active Wallpaper</span>
                            <input
                              type="checkbox"
                              checked={enabled}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-950"
                              onChange={(e) => {
                                const updatedMonitors = [...config.monitors]
                                const idx = updatedMonitors.findIndex(m => m.id === monitorId)
                                if (idx !== -1) {
                                  updatedMonitors[idx].enabled = e.target.checked
                                } else {
                                  updatedMonitors.push({ id: monitorId, enabled: e.target.checked })
                                }
                                handleSave({ monitors: updatedMonitors })
                              }}
                            />
                          </div>

                          {/* Theme override */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Theme Override</span>
                            <select
                              disabled={!enabled}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none text-xs text-no-drag"
                              value={mConf?.themeOverride || ''}
                              onChange={(e) => {
                                const updatedMonitors = [...config.monitors]
                                const idx = updatedMonitors.findIndex(m => m.id === monitorId)
                                const val = e.target.value === '' ? undefined : e.target.value as ThemeName
                                if (idx !== -1) {
                                  updatedMonitors[idx].themeOverride = val
                                } else {
                                  updatedMonitors.push({ id: monitorId, enabled: true, themeOverride: val })
                                }
                                handleSave({ monitors: updatedMonitors })
                              }}
                            >
                              <option value="">Default ({config.theme})</option>
                              <option value="Midnight">Midnight</option>
                              <option value="Drift">Drift</option>
                              <option value="Forest">Forest</option>
                              <option value="Crimson">Crimson</option>
                              <option value="Cyberpunk">Cyberpunk</option>
                              <option value="WarmGlow">Warm Glow</option>
                              <option value="Parchment">Parchment</option>
                              <option value="Blanc">Blanc</option>
                            </select>
                          </div>

                          {/* Preview Buttons */}
                          <div className="flex space-x-2 pt-1">
                            <button
                              disabled={!enabled}
                              onClick={() => handlePreviewTheme(monitorId, currentTheme)}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-50 text-[10px] font-semibold rounded text-slate-200 transition-colors"
                            >
                              Force Render
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-500 text-sm italic">
                    No active displays recognized yet. Press "Refresh Now" to run detection.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div className="max-w-2xl space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Phrase History</h2>
                  <p className="text-slate-400 text-sm">Review local history log of last 10 generated phrases.</p>
                </div>
                {historyMonitorId && historyPhrases.length > 0 && (
                  <button
                    onClick={() => handleClearHistory(historyMonitorId)}
                    className="py-1.5 px-3 bg-rose-950 border border-rose-800 hover:bg-rose-900 rounded-lg text-rose-300 font-semibold text-xs transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {state && Object.keys(state.lastPhrases).length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                  {/* Select Monitor */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Monitor</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                      value={historyMonitorId}
                      onChange={(e) => setHistoryMonitorId(e.target.value)}
                    >
                      {Object.keys(state.lastPhrases).map((id, index) => (
                        <option key={id} value={id}>Display {index + 1} (ID: {id})</option>
                      ))}
                    </select>
                  </div>

                  {/* History List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historical Phrases</h4>
                    
                    {historyPhrases.length > 0 ? (
                      <div className="space-y-2">
                        {historyPhrases.map((phrase, i) => (
                          <div key={i} className="flex space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                            <span className="text-indigo-400 font-mono text-xs mt-0.5">#{i+1}</span>
                            <span className="text-slate-200 italic">"{phraseToPlainText(phrase)}"</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 text-sm italic">
                        No logged phrases for this monitor.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm italic bg-slate-900 border border-slate-800 rounded-xl">
                  No monitor history logs discoverable.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
