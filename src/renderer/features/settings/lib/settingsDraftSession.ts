import type { MurmurConfig } from '@core/domain/types'
import { draftFieldsEqual, pickDraftFields } from '@core/lib/presets/configDelta'

export const DRAFT_SESSION_KEY = 'murmur.settingsDraft.v1'

type DraftSessionPayload = {
  version: 1
  draft: MurmurConfig
  committedRevision: string
}

export function committedDraftRevision(config: MurmurConfig): string {
  return JSON.stringify(pickDraftFields(config))
}

export function readDraftSession(committed: MurmurConfig): MurmurConfig | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftSessionPayload
    if (parsed.version !== 1) return null
    if (parsed.committedRevision !== committedDraftRevision(committed)) return null
    return parsed.draft
  } catch {
    return null
  }
}

export function writeDraftSession(draft: MurmurConfig, committed: MurmurConfig): void {
  const payload: DraftSessionPayload = {
    version: 1,
    draft,
    committedRevision: committedDraftRevision(committed)
  }
  sessionStorage.setItem(DRAFT_SESSION_KEY, JSON.stringify(payload))
}

export function clearDraftSession(): void {
  sessionStorage.removeItem(DRAFT_SESSION_KEY)
}

export function isDraftDirty(committed: MurmurConfig, draft: MurmurConfig): boolean {
  return !draftFieldsEqual(committed, draft)
}
