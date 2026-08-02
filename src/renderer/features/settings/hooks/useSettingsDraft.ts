import { useCallback, useEffect, useRef, useState } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import { applyAestheticMood, type AestheticMoodId } from '@core/lib/presets/aestheticMoods'
import { classifyConfigDelta, pickDraftFields } from '@core/lib/presets/configDelta'
import { getPromptPresetById, presetIdToPrompt } from '@core/lib/presets/promptPresets'
import { getWindowApi } from './getWindowApi'
import {
  clearDraftSession,
  isDraftDirty,
  readDraftSession,
  writeDraftSession
} from '../lib/settingsDraftSession'

type UseSettingsDraftArgs = {
  committed: MurmurConfig | null
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function useSettingsDraft({ committed, showToast }: UseSettingsDraftArgs) {
  const [draft, setDraft] = useState<MurmurConfig | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const initializedRef = useRef(false)
  const committedRef = useRef(committed)
  committedRef.current = committed

  useEffect(() => {
    if (!committed) return

    if (!initializedRef.current) {
      initializedRef.current = true
      const stored = readDraftSession(committed)
      setDraft(stored ?? committed)
      return
    }

    setDraft((prev) => {
      if (!prev) return committed
      if (!isDraftDirty(committed, prev)) return committed
      return { ...committed, ...pickDraftFields(prev) }
    })
  }, [committed])

  useEffect(() => {
    if (!committed || !draft) return
    if (isDraftDirty(committed, draft)) {
      writeDraftSession(draft, committed)
    } else {
      clearDraftSession()
    }
  }, [committed, draft])

  const patchDraft = useCallback((partial: Partial<MurmurConfig>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const applyMoodToDraft = useCallback((moodName: string) => {
    if (moodName === 'Custom') return
    const updates = applyAestheticMood(moodName as AestheticMoodId)
    setDraft((prev) => (prev ? { ...prev, ...updates } : prev))
  }, [])

  const resetDraft = useCallback(() => {
    if (!committedRef.current) return
    setDraft(committedRef.current)
    clearDraftSession()
  }, [])

  const applyDraft = useCallback(async () => {
    const api = getWindowApi()
    const base = committedRef.current
    if (!api || !base || !draft || isApplying) return

    if (draft.tonePreset === 'custom' && !draft.customToneText.trim()) {
      showToast('Enter custom tone text before applying', 'error')
      return
    }

    const deltaKind = classifyConfigDelta(base, draft)
    setIsApplying(true)
    try {
      await api.saveConfig(pickDraftFields(draft))
      clearDraftSession()
      if (deltaKind === 'content') {
        showToast('Phrase regenerated for your new settings.')
      } else if (deltaKind === 'visual') {
        showToast('Look updated.')
      } else {
        showToast('Settings applied.')
      }
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to apply settings'
      showToast(message, 'error')
    } finally {
      setIsApplying(false)
    }
  }, [draft, isApplying, showToast])

  const handlePromptPresetChange = useCallback(
    (presetId: string) => {
      const preset = getPromptPresetById(presetId)
      if (preset?.moodName) {
        applyMoodToDraft(preset.moodName)
        return
      }
      const nextPrompt = presetIdToPrompt(presetId)
      if (nextPrompt) {
        patchDraft({ systemPrompt: nextPrompt })
      }
    },
    [applyMoodToDraft, patchDraft]
  )

  const isDirty = committed && draft ? isDraftDirty(committed, draft) : false

  return {
    draft,
    isDirty,
    isApplying,
    patchDraft,
    applyMoodToDraft,
    applyDraft,
    resetDraft,
    handlePromptPresetChange
  }
}
