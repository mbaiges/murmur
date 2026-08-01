import { MurmurConfig } from '../domain/types'

/** Appearance choices that should produce a new AI phrase (not just re-render the old one). */
export function shouldRegeneratePhraseAfterAppearanceChange(
  prev: MurmurConfig,
  next: MurmurConfig
): boolean {
  return (
    prev.systemPrompt !== next.systemPrompt ||
    prev.enableBold !== next.enableBold ||
    prev.enableItalic !== next.enableItalic ||
    prev.enableNewlines !== next.enableNewlines ||
    prev.enableDifferentFonts !== next.enableDifferentFonts ||
    prev.theme !== next.theme ||
    prev.fontFamily !== next.fontFamily ||
    prev.animation !== next.animation ||
    prev.textAlignment !== next.textAlignment ||
    prev.layoutStyle !== next.layoutStyle
  )
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
    return shouldRegeneratePhraseAfterAppearanceChange(
      { ...prev, layoutStyle: next.layoutStyle },
      next
    )
  }
  return shouldRegeneratePhraseAfterAppearanceChange(prev, next)
}
