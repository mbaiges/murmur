import React, { useState } from 'react'
import SyncIconChip from '../components/SyncIconChip'
import { feedDisplayLabel } from '../lib/feedDisplayLabel'

type NewsSourcesTabProps = {
  feeds: string[]
  syncNews: boolean
  onSyncToggle: () => void
  onFeedsChange: (feeds: string[]) => void
  showSyncChip?: boolean
}

export default function NewsSourcesTab({
  feeds,
  syncNews,
  onSyncToggle,
  onFeedsChange,
  showSyncChip = false
}: NewsSourcesTabProps) {
  const [newFeed, setNewFeed] = useState('')

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">News sources</h2>
          <p className="text-slate-400 text-sm">RSS feeds for this display.</p>
        </div>
        {showSyncChip && (
          <SyncIconChip
            data-testid="settings-sync-tab-news"
            active={syncNews}
            onToggle={onSyncToggle}
            aria-label="Sync news sources with other synced displays"
            title="Sync news sources with other synced displays"
          />
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Add feed</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newFeed.trim() || !newFeed.startsWith('http')) return
            onFeedsChange([...feeds, newFeed.trim()])
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Active feeds</h3>
        {feeds.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-4">No feeds yet. Add a URL above.</p>
        ) : (
          <div className="space-y-2">
            {feeds.map((feed, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-slate-100 font-medium truncate">{feedDisplayLabel(feed)}</div>
                  <div className="text-[10px] text-slate-500 truncate">{feed}</div>
                </div>
                <button
                  type="button"
                  title="Open feed in browser"
                  className="text-slate-400 hover:text-indigo-300 p-1"
                  onClick={() => void window.api?.openExternal(feed)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                {feeds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onFeedsChange(feeds.filter((_, idx) => idx !== index))}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
