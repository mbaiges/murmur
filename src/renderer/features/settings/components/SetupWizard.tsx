import React, { useState } from 'react'
import type { ToastState } from '../types'

type SetupWizardProps = {
  toast: ToastState
  onSubmit: (geminiApiKey: string, feedUrl: string) => Promise<void>
}

export default function SetupWizard({ toast, onSubmit }: SetupWizardProps) {
  const [wizardKey, setWizardKey] = useState('')
  const [wizardFeed, setWizardFeed] = useState('https://feeds.bbci.co.uk/news/rss.xml')

  const handleStartWizard = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(wizardKey.trim(), wizardFeed.trim())
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {toast && (
        <div
          className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300 z-50 border ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-rose-950 border-rose-500 text-rose-300'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="flex items-center space-x-3 mb-6">
          <img src="/logo.png" className="h-10 w-10 object-contain rounded-lg border border-slate-800 p-1 bg-slate-955" alt="" />
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
