import React, { useState } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import {
  MOOD_LINKED_PROMPT_PRESETS,
  STANDALONE_PROMPT_PRESETS,
  promptToPresetId
} from '@core/lib/presets/promptPresets'
import SettingsSelect from '../components/SettingsSelect'
import { OUTPUT_LANGUAGE_OPTIONS } from '../constants/outputLanguages'

type FeedsTabProps = {
  config: MurmurConfig
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
  draftPrompt: string
  isPromptDirty: boolean
  isApplyingPrompt: boolean
  showCheckmark: boolean
  onPromptChange: (val: string) => void
  onApplyPrompt: () => void
  onPresetChange: (presetId: string) => void
}

export default function FeedsTab({
  config,
  saveConfig,
  draftPrompt,
  isPromptDirty,
  isApplyingPrompt,
  showCheckmark,
  onPromptChange,
  onApplyPrompt,
  onPresetChange
}: FeedsTabProps) {
  const [newFeed, setNewFeed] = useState('')

  return (
<div className="w-full max-w-5xl space-y-8">
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
                    onChange={(e) => saveConfig({ geminiApiKey: e.target.value })}
                    placeholder="Enter your API Key"
                  />
                </div>

                {/* AI System Prompt */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">AI System Prompt Preset</label>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center space-x-2">
                        <SettingsSelect
                          selectSize="sm"
                          className="max-w-[220px]"
                          value={promptToPresetId(draftPrompt)}
                          onChange={(e) => onPresetChange(e.target.value)}
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
                        </SettingsSelect>

                        {(isPromptDirty || showCheckmark) && (
                          <button
                            onClick={onApplyPrompt}
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
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="Enter system prompt guidelines..."
                  />
                </div>

                {/* Refresh Interval & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Refresh Interval</label>
                    <SettingsSelect
                      value={config.refreshIntervalMinutes}
                      onChange={(e) => saveConfig({ refreshIntervalMinutes: Number(e.target.value) })}
                    >
                      <option value={15}>Every 15 minutes</option>
                      <option value={30}>Every 30 minutes</option>
                      <option value={60}>Every hour</option>
                      <option value={180}>Every 3 hours</option>
                      <option value={360}>Every 6 hours</option>
                      <option value={720}>Every 12 hours</option>
                      <option value={1440}>Every 24 hours</option>
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output Language</label>
                    <SettingsSelect
                      value={config.language}
                      onChange={(e) => saveConfig({ language: e.target.value })}
                    >
                      {OUTPUT_LANGUAGE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </SettingsSelect>
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
                    onChange={(e) => saveConfig({ launchAtLogin: e.target.checked })}
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
                            saveConfig({ feeds: updated })
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
                    saveConfig({ feeds: [...config.feeds, newFeed.trim()] })
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
  )
}
