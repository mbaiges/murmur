import type { IBackgroundAssetStore } from '../../ports/IBackgroundAssetStore'

const AI_CANDIDATE_NAMES = ['ai-latest.png', 'ai-latest.jpg'] as const

export function resolveLatestAiAbsolutePath(
  store: IBackgroundAssetStore,
  monitorId: string
): string | null {
  for (const name of AI_CANDIDATE_NAMES) {
    const abs = store.resolveAbsolutePath(`${monitorId}/${name}`)
    if (abs) return abs
  }
  return null
}

export function aiImageFileName(buffer: Buffer): (typeof AI_CANDIDATE_NAMES)[number] {
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  return isPng ? 'ai-latest.png' : 'ai-latest.jpg'
}
