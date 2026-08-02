import React from 'react'
import type { LayoutContentEnvelope, MonitorProfile } from '@core/domain/types'
import SyncIconChip from '../components/SyncIconChip'
import MoodGallery from '../components/MoodGallery'
import StyleMiniPreview from '../components/StyleMiniPreview'
import StyleBackgroundCard from '../components/StyleBackgroundCard'
import StylePhraseCard from '../components/StylePhraseCard'
import StyleWidgetsCard from '../components/StyleWidgetsCard'

type StyleTabProps = {
  config: MonitorProfile
  syncStyle: boolean
  onSyncToggle: () => void
  patchDraft: (partial: Partial<MonitorProfile>) => void
  onMoodChange: (moodName: string) => void
  previewPhrase: string
  previewLayoutEnvelope?: LayoutContentEnvelope | null
  displayWidth: number
  displayHeight: number
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  showSyncChip?: boolean
}

export default function StyleTab({
  config,
  syncStyle,
  onSyncToggle,
  patchDraft,
  onMoodChange,
  previewPhrase,
  previewLayoutEnvelope,
  displayWidth,
  displayHeight,
  scrollContainerRef,
  showSyncChip = false
}: StyleTabProps) {
  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Style</h2>
          <p className="text-slate-400 text-sm">
            Moods, then Background → Phrase → Widgets. Click Apply changes when ready (bottom-right).
          </p>
        </div>
        {showSyncChip && (
          <SyncIconChip
            data-testid="settings-sync-tab-style"
            active={syncStyle}
            onToggle={onSyncToggle}
            aria-label="Sync style with other synced displays"
            title="Sync style with other synced displays"
          />
        )}
      </div>

      <StyleMiniPreview
        config={config}
        phrase={previewPhrase}
        displayWidth={displayWidth}
        displayHeight={displayHeight}
        committedLayoutEnvelope={previewLayoutEnvelope}
        scrollContainerRef={scrollContainerRef}
      />

      <MoodGallery config={config} onMoodChange={onMoodChange} />

      <div className="space-y-6 max-w-2xl">
        <StyleBackgroundCard config={config} patchDraft={patchDraft} />
        <StylePhraseCard config={config} patchDraft={patchDraft} />
        <StyleWidgetsCard config={config} patchDraft={patchDraft} />
      </div>
    </div>
  )
}
