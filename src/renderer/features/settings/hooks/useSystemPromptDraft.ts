import { useCallback, useEffect, useState } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import { getPromptPresetById, presetIdToPrompt } from '@core/lib/presets/promptPresets'
import { applyAestheticMood, type AestheticMoodId } from '@core/lib/presets/aestheticMoods'

export function useSystemPromptDraft(
  config: MurmurConfig | null,
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
) {
  const [draftPrompt, setDraftPrompt] = useState('')
  const [isPromptDirty, setIsPromptDirty] = useState(false)
  const [isApplyingPrompt, setIsApplyingPrompt] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    if (config) {
      setDraftPrompt(config.systemPrompt)
      setIsPromptDirty(false)
    }
  }, [config?.systemPrompt])

  const handlePromptChange = useCallback(
    (val: string) => {
      setDraftPrompt(val)
      setIsPromptDirty(val !== config?.systemPrompt)
    },
    [config?.systemPrompt]
  )

  const handleApplyPrompt = useCallback(async () => {
    if (isApplyingPrompt) return
    setIsApplyingPrompt(true)
    try {
      await saveConfig({ systemPrompt: draftPrompt })
      setIsPromptDirty(false)
      setShowCheckmark(true)
      setTimeout(() => setShowCheckmark(false), 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setIsApplyingPrompt(false)
    }
  }, [draftPrompt, isApplyingPrompt, saveConfig])

  const handlePresetChange = useCallback(
    (presetName: string) => {
      const preset = getPromptPresetById(presetName)
      if (preset?.moodName) {
        const updates = applyAestheticMood(preset.moodName as AestheticMoodId)
        if (updates.systemPrompt) {
          setDraftPrompt(updates.systemPrompt)
          setIsPromptDirty(false)
        }
        void saveConfig(updates)
        return
      }
      const nextPrompt = presetIdToPrompt(presetName)
      if (!nextPrompt) return
      setDraftPrompt(nextPrompt)
      setIsPromptDirty(false)
      void saveConfig({ systemPrompt: nextPrompt })
    },
    [saveConfig]
  )

  const syncDraftFromPrompt = useCallback((systemPrompt: string) => {
    setDraftPrompt(systemPrompt)
    setIsPromptDirty(false)
  }, [])

  return {
    draftPrompt,
    isPromptDirty,
    isApplyingPrompt,
    showCheckmark,
    handlePromptChange,
    handleApplyPrompt,
    handlePresetChange,
    syncDraftFromPrompt
  }
}
