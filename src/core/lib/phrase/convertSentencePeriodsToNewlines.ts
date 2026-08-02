/**
 * Canonical wallpaper line-break marker: the two-character sequence `\n`
 * (backslash + n). Models and JSON may also emit real LFs or over-escaped forms.
 */
export const PHRASE_LINE_BREAK = '\\n'

/**
 * Collapse every recognized break form into real LF (U+000A), then optionally
 * to the canonical storage marker.
 */
export function normalizePhraseLineBreaks(
  phrase: string,
  form: 'lf' | 'storage' = 'storage'
): string {
  if (!phrase) return phrase

  let s = phrase.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Literal backslash-n as typed/escaped by the model ("\n", "\\n", …) → LF
  // (one or more backslashes before n)
  s = s.replace(/\\+n/g, '\n')

  // Unicode line/paragraph separators
  s = s.replace(/[\u2028\u2029]+/g, '\n')

  s = s.replace(/\n+/g, '\n')

  if (form === 'lf') return s
  return s.replace(/\n/g, PHRASE_LINE_BREAK)
}

/**
 * Turn sentence-ending periods into wallpaper line breaks.
 *
 * Examples:
 * - `foo. Bar` → `foo\nBar` (storage)
 * - `foo.\nBar` / real LF → `foo\nBar`
 * - Trailing `foo.` → `foo`
 *
 * Does not break on capitals alone (proper names like Chelsea stay inline).
 * Leaves `!` / `?` visible. Skips ellipses (`...`).
 */
export function convertSentencePeriodsToNewlines(phrase: string): string {
  if (!phrase) return phrase

  // Work in real LFs, then emit storage markers
  let s = normalizePhraseLineBreaks(phrase, 'lf')

  // Period at end of a sentence, followed by space or a line break → break
  s = s.replace(/(?<!\.)\.(?!\.)(?:[ \t\u00a0]+|\n)+/g, '\n')

  s = s.replace(/\n+/g, '\n')

  // Drop a lone trailing period (wallpaper reads cleaner without it)
  s = s.replace(/(?<!\.)\.(?!\.)[ \t\u00a0]*$/g, '')

  // Trim spaces around breaks
  s = s.replace(/[ \t\u00a0]*\n[ \t\u00a0]*/g, '\n')

  return s.replace(/\n/g, PHRASE_LINE_BREAK)
}

/**
 * Prepare any layout markup field (phrase, deck, headline, lede, …) for compile/render.
 * Converts storage/`\\n` sequences into real LF so renderers can hard-break instead of
 * showing the literal characters `\n`.
 */
export function prepareMarkupForCompile(text: string, enableNewlines: boolean): string {
  if (!text) return text
  if (!enableNewlines) {
    return normalizePhraseLineBreaks(text, 'lf').replace(/\n/g, ' ')
  }
  return convertSentencePeriodsToNewlines(text).split(PHRASE_LINE_BREAK).join('\n')
}

/** Normalize every string field on a layout payload (all schemas). */
export function normalizeLayoutPayloadFields(
  payload: Record<string, string>,
  enableNewlines: boolean
): Record<string, string> {
  const next: Record<string, string> = { ...payload }
  for (const [key, value] of Object.entries(next)) {
    if (typeof value !== 'string' || value.length === 0) continue
    next[key] = enableNewlines
      ? convertSentencePeriodsToNewlines(value)
      : normalizePhraseLineBreaks(value, 'lf').replace(/\n/g, ' ')
  }
  return next
}
