/** Split flat styled character stream at roughly half the words (magazine spread). */
export function splitFlatCharsAtWordMidpoint<T extends { char: string }>(flat: T[]): { left: T[]; right: T[] } {
  if (flat.length === 0) {
    return { left: [], right: [] }
  }

  const words: T[][] = []
  let current: T[] = []
  for (const ch of flat) {
    if (ch.char === ' ') {
      if (current.length > 0) {
        words.push(current)
        current = []
      }
      words.push([ch])
    } else {
      current.push(ch)
    }
  }
  if (current.length > 0) {
    words.push(current)
  }

  const splitIndex = Math.max(1, Math.ceil(words.length / 2))
  const left = words.slice(0, splitIndex).flat()
  const right = words.slice(splitIndex).flat()
  return { left, right }
}

/**
 * Headline + deck split (newspaper standfirst): prefer sentence break, else word midpoint.
 */
export function splitPlainPhraseHeadlineDeck(phrase: string): { headline: string; deck: string } {
  const trimmed = phrase.trim()
  if (!trimmed) {
    return { headline: '', deck: '' }
  }

  const sentenceBreak = trimmed.search(/[.!?…]\s+/)
  if (sentenceBreak > 12 && sentenceBreak < trimmed.length - 8) {
    const headline = trimmed.slice(0, sentenceBreak + 1).trim()
    const deck = trimmed.slice(sentenceBreak + 1).trim()
    return { headline, deck }
  }

  const emDash = trimmed.search(/\s[—–-]\s/)
  if (emDash > 10) {
    return {
      headline: trimmed.slice(0, emDash).trim(),
      deck: trimmed.slice(emDash).replace(/^[—–-]\s*/, '').trim()
    }
  }

  const words = trimmed.split(/\s+/)
  if (words.length <= 2) {
    return { headline: trimmed, deck: '' }
  }

  const splitAt = Math.max(2, Math.ceil(words.length * 0.45))
  return {
    headline: words.slice(0, splitAt).join(' '),
    deck: words.slice(splitAt).join(' ')
  }
}
