import React from 'react'
import type { MurmurConfig, MurmurState, ThemeName } from '@core/domain/types'
import { phraseToPlainText } from '@core/lib/phrase/phrasePlainText'

type MonitorsTabProps = {
  config: MurmurConfig
  state: MurmurState | null
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
  onPreviewTheme: (monitorId: string, theme: ThemeName) => void
}

export default function MonitorsTab({ config, state, saveConfig, onPreviewTheme }: MonitorsTabProps) {
  return (
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
                                saveConfig({ monitors: updatedMonitors })
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
                            </select>
                          </div>

                          {/* Preview Buttons */}
                          <div className="flex space-x-2 pt-1">
                            <button
                              disabled={!enabled}
                              onClick={() => onPreviewTheme(monitorId, currentTheme)}
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
  )
}
