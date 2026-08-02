import { useCallback } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import { applyAestheticMood, type AestheticMoodId } from '@core/lib/presets/aestheticMoods'

export function useMoodChange(
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>,
  syncDraftFromPrompt: (systemPrompt: string) => void
) {
  return useCallback(
    (moodName: string) => {
      if (moodName === 'Custom') return
      const moodId = moodName as AestheticMoodId
      const updates = applyAestheticMood(moodId)
      if (updates.systemPrompt) {
        syncDraftFromPrompt(updates.systemPrompt)
      }
      void saveConfig(updates)
    },
    [saveConfig, syncDraftFromPrompt]
  )
}
