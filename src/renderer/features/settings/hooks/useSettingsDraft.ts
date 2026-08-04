import { useCallback, useEffect, useRef, useState } from 'react'
import type { MonitorProfile, MurmurConfig } from '@core/domain/types'
import { applyAestheticMood, type AestheticMoodId } from '@core/lib/presets/aestheticMoods'
import { classifyConfigDelta, pickDraftFields } from '@core/lib/presets/configDelta'
import { getMonitorProfile } from '@core/lib/config/monitorProfiles'
import { pickScopePatch } from '@core/lib/config/monitorScopeFields'
import { getPromptPresetById, presetIdToPrompt } from '@core/lib/presets/promptPresets'
import {
  clearDraftSession,
  isDraftDirty,
  readDraftSession,
  writeDraftSession
} from '../lib/settingsDraftSession'
import { applyMonitorProfileSave } from './useScopedMonitorSave'
import { getWindowApi } from './getWindowApi'

type UseSettingsDraftArgs = {
  committed: MurmurConfig | null
  monitorId: string
  getConfigSnapshot: () => MurmurConfig | null
  applyLocalConfig: (next: MurmurConfig) => void
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function useSettingsDraft({
  committed,
  monitorId,
  getConfigSnapshot,
  applyLocalConfig,
  showToast
}: UseSettingsDraftArgs) {
  const [draft, setDraft] = useState<MonitorProfile | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [pendingPhotoSourcePath, setPendingPhotoSourcePath] = useState<string | null>(null)
  const committedProfileRef = useRef<MonitorProfile | null>(null)

  const committedProfile = committed ? getMonitorProfile(committed, monitorId) : null
  committedProfileRef.current = committedProfile

  useEffect(() => {
    if (!committedProfile) return
    const stored = readDraftSession(monitorId, committedProfile)
    setDraft(stored ?? { ...committedProfile, overlays: { ...committedProfile.overlays } })
    setPendingPhotoSourcePath(null)
  }, [committedProfile, monitorId])

  useEffect(() => {
    if (!committedProfile || !draft) return
    if (isDraftDirty(committedProfile, draft)) {
      writeDraftSession(monitorId, draft, committedProfile)
    } else {
      clearDraftSession(monitorId)
    }
  }, [committedProfile, draft, monitorId])

  const patchDraft = useCallback((partial: Partial<MonitorProfile>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            ...partial,
            overlays: partial.overlays ? { ...prev.overlays, ...partial.overlays } : prev.overlays
          }
        : prev
    )
  }, [])

  const applyMoodToDraft = useCallback((moodName: string) => {
    if (moodName === 'Custom') return
    const updates = applyAestheticMood(moodName as AestheticMoodId)
    setDraft((prev) => (prev ? { ...prev, ...updates, overlays: prev.overlays } : prev))
  }, [])

  const resetDraft = useCallback(() => {
    if (!committedProfileRef.current) return
    const p = committedProfileRef.current
    setDraft({ ...p, overlays: { ...p.overlays } })
    clearDraftSession(monitorId)
    setPendingPhotoSourcePath(null)
  }, [monitorId])

  const applyDraft = useCallback(async () => {
    const api = getWindowApi()
    const baseProfile = committedProfileRef.current
    const baseConfig = getConfigSnapshot()
    if (!api || !baseConfig || !baseProfile || !draft || isApplying) return

    if (draft.tonePreset === 'custom' && !draft.customToneText.trim()) {
      showToast('Enter custom tone text before applying', 'error')
      return
    }

    if (
      draft.backgroundMode === 'ai' &&
      draft.backgroundPresetId === 'Custom' &&
      !draft.customBackgroundPrompt.trim()
    ) {
      showToast('Enter a custom background prompt before applying', 'error')
      return
    }

    if (draft.customBackgroundPrompt.length > 2048) {
      showToast('Custom background prompt must be 2048 characters or less', 'error')
      return
    }

    let profileToApply = draft
    if (pendingPhotoSourcePath && api.importBackgroundPhoto) {
      try {
        const { relPath } = await api.importBackgroundPhoto(monitorId, pendingPhotoSourcePath)
        profileToApply = {
          ...draft,
          backgroundMode: 'photo',
          backgroundPhotoRelPath: relPath
        }
        setPendingPhotoSourcePath(null)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to import photo'
        showToast(message, 'error')
        return
      }
    }

    const deltaKind = classifyConfigDelta(baseConfig, {
      ...baseConfig,
      monitors: baseConfig.monitors.map((m) =>
        m.id === monitorId ? { ...m, profile: profileToApply } : m
      )
    })

    setIsApplying(true)
    try {
      let next = applyMonitorProfileSave(
        baseConfig,
        monitorId,
        'style',
        pickScopePatch('style', pickDraftFields(profileToApply))
      )
      next = applyMonitorProfileSave(next, monitorId, 'voice', pickScopePatch('voice', pickDraftFields(profileToApply)))
      applyLocalConfig(next)
      await api.saveConfig({ monitors: next.monitors })
      const freshState = await api.getState()
      setDraft({ ...profileToApply, overlays: { ...profileToApply.overlays } })
      clearDraftSession(monitorId)
      if (freshState.lastGenerationError) {
        showToast(freshState.lastGenerationError, 'error')
      } else if (deltaKind === 'content') {
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
  }, [applyLocalConfig, draft, getConfigSnapshot, isApplying, monitorId, pendingPhotoSourcePath, showToast])

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

  const isDirty =
    (committedProfile && draft ? isDraftDirty(committedProfile, draft) : false) ||
    pendingPhotoSourcePath != null

  return {
    draft,
    isDirty,
    isApplying,
    patchDraft,
    applyMoodToDraft,
    applyDraft,
    resetDraft,
    handlePromptPresetChange,
    pendingPhotoSourcePath,
    setPendingPhotoSourcePath
  }
}
