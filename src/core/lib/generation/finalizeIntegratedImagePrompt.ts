/** Cloudflare FLUX prompt limit (aligned with custom background prompt max). */
export const MAX_INTEGRATED_IMAGE_PROMPT_CHARS = 2048

/**
 * Appends a non-negotiable verbatim phrase block so FLUX receives the full string even if
 * the composer LLM shortened the scene prompt.
 */
export function finalizeIntegratedImagePrompt(composedPrompt: string, phrase: string): string {
  const verbatim = phrase.trim()
  const scene = composedPrompt.trim()

  if (!verbatim) {
    return scene.slice(0, MAX_INTEGRATED_IMAGE_PROMPT_CHARS)
  }

  const mandatoryBlock = [
    'MANDATORY READABLE TEXT IN THE IMAGE (exact copy — every word, same language, punctuation, and word order; no summarizing, no ellipsis, no dropping clauses):',
    verbatim,
    'The wallpaper must show all of the text above legibly (use multiple lines, smaller type, or wrapped neon/sign layout as needed). Do not render only a celebrity name or headline fragment — include the full string.'
  ].join('\n')

  const sep = '\n\n'
  const budget = MAX_INTEGRATED_IMAGE_PROMPT_CHARS - mandatoryBlock.length - sep.length
  const trimmedScene = budget > 0 && scene.length > budget ? scene.slice(0, budget) : scene

  const combined = trimmedScene ? `${trimmedScene}${sep}${mandatoryBlock}` : mandatoryBlock
  return combined.slice(0, MAX_INTEGRATED_IMAGE_PROMPT_CHARS)
}
