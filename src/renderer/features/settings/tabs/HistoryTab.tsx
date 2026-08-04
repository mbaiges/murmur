import React, { useEffect, useState } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import { parseHistoryEntry } from '@core/lib/layout/layoutContentParse'
import { layoutContentPreview } from '@core/lib/layout/layoutContentPreview'
import { getMonitorProfile } from '@core/lib/config/monitorProfiles'

export type HistoryTabProps = {
  config: MurmurConfig
  selectedMonitorId: string
  /** Bumps after each successful refresh so we reload persisted history. */
  lastRefreshTime?: string
}

export default function HistoryTab({ config, selectedMonitorId, lastRefreshTime }: HistoryTabProps) {
  const [historyPhrases, setHistoryPhrases] = useState<string[]>([])
  const [historyViewMode, setHistoryViewMode] = useState<'preview' | 'raw'>('preview')

  const profile = getMonitorProfile(config, selectedMonitorId)

  useEffect(() => {
    const api = window.api
    if (api && selectedMonitorId) {
      api.getHistory(selectedMonitorId).then(setHistoryPhrases).catch(console.error)
    }
  }, [selectedMonitorId, lastRefreshTime])

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">History</h2>
        <p className="text-slate-400 text-sm">Phrase history for the display selected in the sidebar.</p>
      </div>

      {!selectedMonitorId ? (
        <div className="py-8 text-center text-slate-500 text-sm italic bg-slate-900 border border-slate-800 rounded-xl">
          No display selected. Press Refresh Now in the sidebar after setup.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-sm font-bold text-white shrink-0">Historical phrases</h3>
            {historyPhrases.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  void window.api?.clearHistory(selectedMonitorId).then(() => setHistoryPhrases([]))
                }}
                className="py-1.5 px-3 bg-rose-950 border border-rose-800 rounded-lg text-rose-300 text-xs font-semibold shrink-0"
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
              const envelope = parseHistoryEntry(entry, profile.layoutStyle)
              const preview = layoutContentPreview(envelope)
              const raw = JSON.stringify(envelope.payload, null, 2)
              return (
                <div key={i} className="flex gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                  <span className="text-indigo-400 font-mono text-xs shrink-0">#{i + 1}</span>
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
    </div>
  )
}
