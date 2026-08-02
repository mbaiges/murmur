export interface PhraseFormatFlags {
  enableBold: boolean
  enableItalic: boolean
  enableNewlines: boolean
  enableDifferentFonts: boolean
}

export const DEFAULT_PHRASE_FORMAT_FLAGS: PhraseFormatFlags = {
  enableBold: true,
  enableItalic: true,
  enableNewlines: true,
  enableDifferentFonts: true
}

export function phraseFormatFlagsFromConfig(config: PhraseFormatFlags): PhraseFormatFlags {
  return {
    enableBold: config.enableBold,
    enableItalic: config.enableItalic,
    enableNewlines: config.enableNewlines,
    enableDifferentFonts: config.enableDifferentFonts
  }
}

/** Split stored phrase into display lines; raw \\n escapes are preserved in storage. */
export function splitPhraseLines(phrase: string, enableNewlines: boolean): string[] {
  if (!phrase) {
    return ['']
  }
  if (enableNewlines) {
    return phrase.split('\\n')
  }
  return [phrase.replace(/\\n/g, ' ')]
}
