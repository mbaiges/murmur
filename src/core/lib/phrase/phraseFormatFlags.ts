import {
  convertSentencePeriodsToNewlines,
  normalizePhraseLineBreaks,
  PHRASE_LINE_BREAK
} from './convertSentencePeriodsToNewlines'

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
  enableDifferentFonts: false
}

export function phraseFormatFlagsFromConfig(config: PhraseFormatFlags): PhraseFormatFlags {
  return {
    enableBold: config.enableBold,
    enableItalic: config.enableItalic,
    enableNewlines: config.enableNewlines,
    enableDifferentFonts: config.enableDifferentFonts
  }
}

/** Split stored phrase into display lines; canonical breaks are the two-char sequence `\n`. */
export function splitPhraseLines(phrase: string, enableNewlines: boolean): string[] {
  if (!phrase) {
    return ['']
  }
  if (enableNewlines) {
    return convertSentencePeriodsToNewlines(phrase).split(PHRASE_LINE_BREAK)
  }
  return [normalizePhraseLineBreaks(phrase, 'lf').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()]
}
