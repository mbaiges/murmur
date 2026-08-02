import { MurmurConfig } from '../../domain/types'
import { classifyConfigDelta } from './configDelta'

/** @deprecated Prefer classifyConfigDelta; true when Apply should run Gemini refresh. */
export function shouldRegeneratePhraseAfterAppearanceChange(
  prev: MurmurConfig,
  next: MurmurConfig
): boolean {
  return classifyConfigDelta(prev, next) === 'content'
}

/**
 * E2E with a captured live phrase: layout-only changes re-render the same text (no extra Gemini calls).
 */
export function shouldRegeneratePhraseAfterConfigSave(
  prev: MurmurConfig,
  next: MurmurConfig
): boolean {
  if (
    process.env.MURMUR_E2E === 'true' &&
    process.env.MURMUR_E2E_REUSE_CAPTURED_PHRASE === 'true'
  ) {
    return (
      classifyConfigDelta({ ...prev, layoutStyle: next.layoutStyle }, next) === 'content'
    )
  }
  return classifyConfigDelta(prev, next) === 'content'
}
