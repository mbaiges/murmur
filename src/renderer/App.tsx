import React, { useState, useEffect } from 'react'
import { MurmurConfig, MurmurState, ThemeName, MonitorConfig } from '../domain/types'

// Type cast helper for electron window API
const api = (window as any).api

export default function App() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<MurmurState | null>(null)
  const [activeTab, setActiveTab] = useState<'feeds' | 'appearance' | 'monitors' | 'history'>('feeds')
  const [newFeed, setNewFeed] = useState('')
  const [historyMonitorId, setHistoryMonitorId] = useState<string>('')
  const [historyPhrases, setHistoryPhrases] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Setup Wizard fields
  const [wizardKey, setWizardKey] = useState('')
  const [wizardFeed, setWizardFeed] = useState('https://feeds.bbci.co.uk/news/rss.xml')

  useEffect(() => {
    // 1. Fetch initial config and state
    if (api) {
      api.getConfig().then(setConfig).catch(console.error)
      api.getState().then(setState).catch(console.error)

      // 2. Listen to live state updates
      const removeListener = api.onStateUpdated((updatedState: MurmurState) => {
        setState(updatedState)
      })
      return () => removeListener()
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
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">M</div>
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300 z-50 border ${
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">M</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Murmur</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Windows Desktop App</p>
            </div>
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
        
        {/* TAB 1: FEEDS */}
        {activeTab === 'feeds' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Ingestion & Feeds</h2>
              <p className="text-slate-400 text-sm">Configure your Gemini keys and the RSS feeds utilized to synthesize nonsense phrases.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                <div className="flex space-x-3">
                  <input
                    type="password"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none transition-all"
                    value={config.geminiApiKey}
                    onChange={(e) => handleSave({ geminiApiKey: e.target.value })}
                    placeholder="Enter your API Key"
                  />
                </div>
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
                    <option value={720}>Every 12 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output Language</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                    value={config.language}
                    onChange={(e) => handleSave({ language: e.target.value })}
                  >
                    <option value="auto">Auto (Match feed)</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>

              {/* Startup Option */}
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-white">Launch at login</h4>
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
              <p className="text-slate-400 text-sm">Customize visual style, typography, and wallpaper overlay items.</p>
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
                    <option value="Midnight">Midnight (Dark Indigo)</option>
                    <option value="Drift">Drift (Ocean Wave)</option>
                    <option value="Parchment">Parchment (Warm Tan Paper)</option>
                    <option value="Blanc">Blanc (Minimalist Off-White)</option>
                    <option value="Static">Static (Noise/TV Texture)</option>
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
                    <option value="Playfair Display">Playfair Display (Poetic/Modern Serif)</option>
                    <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                  </select>
                </div>
              </div>

              {/* Transition Animations */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transition Animation</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition-all"
                  value={config.animation}
                  onChange={(e) => handleSave({ animation: e.target.value as any })}
                >
                  <option value="Fade">Fade In</option>
                  <option value="DriftIn">Drift & Fade</option>
                  <option value="Typewriter">Typewriter Reveal</option>
                  <option value="Instant">Instant Cut</option>
                </select>
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

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs italic text-slate-400 min-h-[60px] flex items-center justify-center text-center">
                          "{phrase}"
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-850">
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
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none text-xs"
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
                            <option value="Parchment">Parchment</option>
                            <option value="Blanc">Blanc</option>
                            <option value="Static">Static</option>
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
                          <span className="text-slate-200 italic">"{phrase}"</span>
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
  )
}
