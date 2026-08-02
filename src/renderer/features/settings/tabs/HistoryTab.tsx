import React from 'react'
import type { MurmurConfig, MurmurState } from '@core/domain/types'
import { parseHistoryEntry } from '@core/lib/layout/layoutContentParse'
import { layoutContentPreview } from '@core/lib/layout/layoutContentPreview'
import SettingsSelect from '../components/SettingsSelect'

type HistoryTabProps = {
  config: MurmurConfig
  state: MurmurState | null
  historyMonitorId: string
  setHistoryMonitorId: (id: string) => void
  historyPhrases: string[]
  historyViewMode: 'preview' | 'raw'
  setHistoryViewMode: (mode: 'preview' | 'raw') => void
  onClearHistory: (monitorId: string) => void
}

export default function HistoryTab({
  config,
  state,
  historyMonitorId,
  setHistoryMonitorId,
  historyPhrases,
  historyViewMode,
  setHistoryViewMode,
  onClearHistory
}: HistoryTabProps) {
  return (
<div className="max-w-2xl space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Phrase History</h2>
                  <p className="text-slate-400 text-sm">Review local history log of last 10 generated phrases.</p>
                </div>
                {historyMonitorId && historyPhrases.length > 0 && (
                  <button
                    onClick={() => onClearHistory(historyMonitorId)}
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
                    <SettingsSelect
                      value={historyMonitorId}
                      onChange={(e) => setHistoryMonitorId(e.target.value)}
                    >
                      {Object.keys(state.lastPhrases).map((id, index) => (
                        <option key={id} value={id}>Display {index + 1} (ID: {id})</option>
                      ))}
                    </SettingsSelect>
                  </div>

                  {/* History List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historical Phrases</h4>
                      <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setHistoryViewMode('preview')}
                          className={`px-3 py-1.5 font-semibold transition-colors ${historyViewMode === 'preview' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryViewMode('raw')}
                          className={`px-3 py-1.5 font-semibold transition-colors ${historyViewMode === 'raw' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}`}
                        >
                          Raw JSON
                        </button>
                      </div>
                    </div>
                    
                    {historyPhrases.length > 0 ? (
                      <div className="space-y-2">
                        {historyPhrases.map((entry, i) => {
                          const envelope = parseHistoryEntry(entry, config?.layoutStyle ?? 'centered')
                          const preview = layoutContentPreview(envelope)
                          const raw = JSON.stringify(envelope.payload, null, 2)
                          return (
                          <div key={i} className="flex space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                            <span className="text-indigo-400 font-mono text-xs mt-0.5 shrink-0">#{i+1}</span>
                            {historyViewMode === 'preview' ? (
                              <span className="text-slate-200 italic">"{preview}"</span>
                            ) : (
                              <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap overflow-x-auto flex-1">{raw}</pre>
                            )}
                          </div>
                          )
                        })}
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
  )
}
