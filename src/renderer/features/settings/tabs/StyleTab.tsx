import React from 'react'
import type { MurmurConfig } from '@core/domain/types'
import MoodGallery from '../components/MoodGallery'
import StyleMiniPreview from '../components/StyleMiniPreview'
import StyleBackgroundCard from '../components/StyleBackgroundCard'
import StylePhraseCard from '../components/StylePhraseCard'
import StyleWidgetsCard from '../components/StyleWidgetsCard'

type StyleTabProps = {
  config: MurmurConfig
  patchDraft: (partial: Partial<MurmurConfig>) => void
  onMoodChange: (moodName: string) => void
  previewPhrase: string
}

export default function StyleTab({ config, patchDraft, onMoodChange, previewPhrase }: StyleTabProps) {
  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Style</h2>
        <p className="text-slate-400 text-sm">
          Moods, then Background → Phrase → Widgets. Click Apply changes when ready (bottom-right).
        </p>
      </div>

      <StyleMiniPreview config={config} phrase={previewPhrase} />

      <MoodGallery config={config} onMoodChange={onMoodChange} />

      <div className="space-y-6 max-w-2xl">
        <StyleBackgroundCard config={config} patchDraft={patchDraft} />
        <StylePhraseCard config={config} patchDraft={patchDraft} />
        <StyleWidgetsCard config={config} patchDraft={patchDraft} />
      </div>
    </div>
  )
}
