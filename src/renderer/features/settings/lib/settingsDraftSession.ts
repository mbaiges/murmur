import type { MonitorProfile } from '@core/domain/types'
import { draftFieldsEqual, pickDraftFields } from '@core/lib/presets/configDelta'

export function draftSessionKey(monitorId: string): string {
  return `murmur.settingsDraft.v2:${monitorId}`
}

type DraftSessionPayload = {
  version: 2
  draft: MonitorProfile
  committedRevision: string
}

export function committedDraftRevision(profile: MonitorProfile): string {
  return JSON.stringify(pickDraftFields(profile))
}

export function readDraftSession(monitorId: string, committed: MonitorProfile): MonitorProfile | null {
  try {
    const raw = sessionStorage.getItem(draftSessionKey(monitorId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftSessionPayload
    if (parsed.version !== 2) return null
    if (parsed.committedRevision !== committedDraftRevision(committed)) return null
    return parsed.draft
  } catch {
    return null
  }
}

export function writeDraftSession(monitorId: string, draft: MonitorProfile, committed: MonitorProfile): void {
  const payload: DraftSessionPayload = {
    version: 2,
    draft,
    committedRevision: committedDraftRevision(committed)
  }
  sessionStorage.setItem(draftSessionKey(monitorId), JSON.stringify(payload))
}

export function clearDraftSession(monitorId: string): void {
  sessionStorage.removeItem(draftSessionKey(monitorId))
}

export function isDraftDirty(committed: MonitorProfile, draft: MonitorProfile): boolean {
  return !draftFieldsEqual(committed, draft)
}
