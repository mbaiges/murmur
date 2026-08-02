import React from 'react'
import type { MurmurConfig } from '@core/domain/types'
import MoodGallery from '../components/MoodGallery'
import AppearanceTab from './AppearanceTab'

type StyleTabProps = {
  config: MurmurConfig
  patchDraft: (partial: Partial<MurmurConfig>) => void
  onMoodChange: (moodName: string) => void
}

export default function StyleTab({ config, patchDraft, onMoodChange }: StyleTabProps) {
  return (
    <div className="max-w-4xl space-y-8 pb-24">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Style</h2>
        <p className="text-slate-400 text-sm">
          Pick a mood preset or customize wallpaper look, layout, and overlays. Click Apply changes when ready.
        </p>
      </div>
      <MoodGallery config={config} onMoodChange={onMoodChange} />
      <AppearanceTab
        config={config}
        patchDraft={patchDraft}
        onMoodChange={onMoodChange}
        hideMoodPreset
        hideFormatting
        showPageHeader={false}
      />
    </div>
  )
}
