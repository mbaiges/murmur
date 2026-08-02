/** Validates markdown/font markup balance in a single phrase field. */
export function isValidPoemSyntax(phrase: string): boolean {
  if (!phrase) return false

  const boldCount = phrase.split('**').length - 1
  if (boldCount % 2 !== 0) return false

  const withoutBold = phrase.replace(/\*\*/g, '')
  const italicCount = withoutBold.split('*').length - 1
  if (italicCount % 2 !== 0) return false

  const codeCount = phrase.split('`').length - 1
  if (codeCount % 2 !== 0) return false

  const openMatches = phrase.match(/\[font:/g) || []
  const closeMatches = phrase.match(/\[\/font\]/g) || []
  if (openMatches.length !== closeMatches.length) return false

  const fontRegex = /\[font:([^\]]+)\]/g
  let match
  const allowedFonts = ['EB Garamond', 'Playfair Display', 'Outfit', 'Garamond Bold', 'Monospace']
  while ((match = fontRegex.exec(phrase)) !== null) {
    if (!allowedFonts.includes(match[1])) {
      return false
    }
  }

  if (phrase.includes('`[font:') || phrase.includes('`[/font]')) {
    return false
  }

  return true
}

export function validateMarkdownFields(
  spec: import('./layoutContentSpecs').LayoutContentSpec,
  payload: Record<string, string>
): boolean {
  for (const field of spec.fields) {
    if (field.type !== 'markdown') continue
    const value = payload[field.key]
    if (!value) continue
    if (!isValidPoemSyntax(value)) {
      return false
    }
  }
  return true
}
