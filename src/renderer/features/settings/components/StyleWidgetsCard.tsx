import React from 'react'
import type { MurmurConfig } from '@core/domain/types'

type StyleWidgetsCardProps = {
  config: MurmurConfig
  patchDraft: (partial: Partial<MurmurConfig>) => void
}

export default function StyleWidgetsCard({ config, patchDraft }: StyleWidgetsCardProps) {
  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
      data-testid="style-section-widgets"
    >
      <div>
        <h3 className="text-sm font-bold text-white">Widgets</h3>
        <p className="text-xs text-slate-500 mt-1">Optional overlays on top of the wallpaper.</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-medium text-white">Date &amp; Time</h5>
          <p className="text-xs text-slate-500">Current local date/time in the corner.</p>
        </div>
        <input
          type="checkbox"
          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
          checked={config.overlays.dateTime}
          onChange={(e) =>
            patchDraft({
              overlays: { ...config.overlays, dateTime: e.target.checked }
            })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-medium text-white">Source credits</h5>
          <p className="text-xs text-slate-500">News sources in the bottom-right.</p>
        </div>
        <input
          type="checkbox"
          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
          checked={config.overlays.sourceCredit}
          onChange={(e) =>
            patchDraft({
              overlays: { ...config.overlays, sourceCredit: e.target.checked }
            })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-medium text-white">Concepts sampled</h5>
          <p className="text-xs text-slate-500">Headline list in the bottom-left.</p>
        </div>
        <input
          type="checkbox"
          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
          checked={config.overlays.inspiringHeadlines}
          onChange={(e) =>
            patchDraft({
              overlays: { ...config.overlays, inspiringHeadlines: e.target.checked }
            })
          }
        />
      </div>
    </section>
  )
}
