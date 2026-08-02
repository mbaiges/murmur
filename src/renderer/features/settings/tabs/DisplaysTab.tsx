import React, { useEffect, useState } from 'react'
import type { MurmurConfig, MurmurState, ThemeName } from '@core/domain/types'
import { phraseToPlainText } from '@core/lib/phrase/phrasePlainText'
import { parseHistoryEntry } from '@core/lib/layout/layoutContentParse'
import { layoutContentPreview } from '@core/lib/layout/layoutContentPreview'
import type { DisplaysSection } from '../types'
import SettingsSelect from '../components/SettingsSelect'

type DisplaysTabProps = {
  config: MurmurConfig
  state: MurmurState | null
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
  onPreviewTheme: (monitorId: string, theme: ThemeName) => void
  section: DisplaysSection
  onSectionChange: (section: DisplaysSection) => void
}

export default function DisplaysTab({
  config,
  state,
  saveConfig,
  onPreviewTheme,
  section,
  onSectionChange
}: DisplaysTabProps) {
  const monitorIds = state ? Object.keys(state.lastPhrases) : []
  const [selectedMonitorId, setSelectedMonitorId] = useState('')
  const [historyPhrases, setHistoryPhrases] = useState<string[]>([])
  const [historyViewMode, setHistoryViewMode] = useState<'preview' | 'raw'>('preview')

  useEffect(() => {
    if (state && monitorIds.length > 0 && !selectedMonitorId) {
      setSelectedMonitorId(monitorIds[0])
    }
  }, [state, monitorIds, selectedMonitorId])

  useEffect(() => {
    const api = window.api
    if (api && selectedMonitorId && section === 'history') {
      api.getHistory(selectedMonitorId).then(setHistoryPhrases).catch(console.error)
    }
  }, [selectedMonitorId, section])

  const showSelector = monitorIds.length > 1

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Displays</h2>
        <p className="text-slate-400 text-sm">Per-monitor wallpaper controls and phrase history.</p>
      </div>

      <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => onSectionChange('monitors')}
          className={`px-4 py-2 font-semibold ${section === 'monitors' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-950 text-slate-400'}`}
        >
          Monitors
        </button>
        <button
          type="button"
          onClick={() => onSectionChange('history')}
          className={`px-4 py-2 font-semibold ${section === 'history' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-950 text-slate-400'}`}
        >
          History
        </button>
      </div>

      {monitorIds.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm italic bg-slate-900 border border-slate-800 rounded-xl">
          No displays detected yet. Press Refresh Now in the sidebar.
        </div>
      ) : (
        <>
          {showSelector && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Selected display</label>
              <SettingsSelect
                className="max-w-md"
                value={selectedMonitorId}
                onChange={(e) => setSelectedMonitorId(e.target.value)}
              >
                {monitorIds.map((id, index) => (
                  <option key={id} value={id}>
                    Display {index + 1} ({id})
                  </option>
                ))}
              </SettingsSelect>
            </div>
          )}

          {section === 'monitors' && selectedMonitorId && (
            <MonitorDetailCard
              monitorId={selectedMonitorId}
              index={monitorIds.indexOf(selectedMonitorId)}
              config={config}
              state={state}
              saveConfig={saveConfig}
              onPreviewTheme={onPreviewTheme}
            />
          )}

          {section === 'history' && selectedMonitorId && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Historical phrases</h3>
                {historyPhrases.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      void window.api?.clearHistory(selectedMonitorId).then(() => setHistoryPhrases([]))
                    }}
                    className="py-1.5 px-3 bg-rose-950 border border-rose-800 rounded-lg text-rose-300 text-xs font-semibold"
                  >
                    Clear History
                  </button>
                )}
              </div>
              <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs w-fit">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('preview')}
                  className={`px-3 py-1.5 font-semibold ${historyViewMode === 'preview' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-950 text-slate-400'}`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('raw')}
                  className={`px-3 py-1.5 font-semibold ${historyViewMode === 'raw' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-950 text-slate-400'}`}
                >
                  Raw JSON
                </button>
              </div>
              {historyPhrases.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">No logged phrases for this display.</p>
              ) : (
                historyPhrases.map((entry, i) => {
                  const envelope = parseHistoryEntry(entry, config.layoutStyle)
                  const preview = layoutContentPreview(envelope)
                  const raw = JSON.stringify(envelope.payload, null, 2)
                  return (
                    <div key={i} className="flex gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                      <span className="text-indigo-400 font-mono text-xs">#{i + 1}</span>
                      {historyViewMode === 'preview' ? (
                        <span className="text-slate-200 italic">&ldquo;{preview}&rdquo;</span>
                      ) : (
                        <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap flex-1">{raw}</pre>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MonitorDetailCard({
  monitorId,
  index,
  config,
  state,
  saveConfig,
  onPreviewTheme
}: {
  monitorId: string
  index: number
  config: MurmurConfig
  state: MurmurState | null
  saveConfig: DisplaysTabProps['saveConfig']
  onPreviewTheme: DisplaysTabProps['onPreviewTheme']
}) {
  const phrase = state?.lastPhrases[monitorId]
  const mConf = config.monitors.find((m) => m.id === monitorId)
  const enabled = mConf ? mConf.enabled : true
  const currentTheme = mConf?.themeOverride || config.theme

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-white">Display {index + 1}</h4>
        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">{monitorId}</span>
      </div>
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs italic text-slate-400 min-h-[60px] flex items-center justify-center text-center">
        &ldquo;{phrase ? phraseToPlainText(phrase) : 'No phrase generated yet'}&rdquo;
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Active wallpaper</span>
        <input
          type="checkbox"
          checked={enabled}
          className="rounded border-slate-800 text-indigo-600 h-3.5 w-3.5 bg-slate-950"
          onChange={(e) => {
            const updatedMonitors = [...config.monitors]
            const idx = updatedMonitors.findIndex((m) => m.id === monitorId)
            if (idx !== -1) updatedMonitors[idx].enabled = e.target.checked
            else updatedMonitors.push({ id: monitorId, enabled: e.target.checked })
            saveConfig({ monitors: updatedMonitors })
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="text-slate-400 shrink-0">Theme override</span>
        <SettingsSelect
          selectSize="sm"
          disabled={!enabled}
          className="text-slate-300"
          value={mConf?.themeOverride || ''}
          onChange={(e) => {
            const updatedMonitors = [...config.monitors]
            const idx = updatedMonitors.findIndex((m) => m.id === monitorId)
            const val = e.target.value === '' ? undefined : (e.target.value as ThemeName)
            if (idx !== -1) updatedMonitors[idx].themeOverride = val
            else updatedMonitors.push({ id: monitorId, enabled: true, themeOverride: val })
            saveConfig({ monitors: updatedMonitors })
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
        </SettingsSelect>
      </div>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => onPreviewTheme(monitorId, currentTheme)}
        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold rounded text-slate-200 disabled:opacity-50"
      >
        Force Render
      </button>
    </div>
  )
}
