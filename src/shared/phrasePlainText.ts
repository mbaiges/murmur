/** Strip AI/wallpaper markup so phrases read as plain text in settings UI. */
export function phraseToPlainText(phrase: string): string {
  if (!phrase) {
    return ''
  }

  return phrase
    .replace(/\[font:[^\]]+\]/g, '')
    .replace(/\[\/font\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
