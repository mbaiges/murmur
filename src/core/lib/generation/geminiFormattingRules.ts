import { PhraseFormatFlags } from '../phrase/phraseFormatFlags'

/** LLM prompt fragment: only enabled formatters are allowed in generated phrases. */
export function buildPhraseFormattingRules(flags: PhraseFormatFlags): string {
  const { enableBold, enableItalic, enableNewlines, enableDifferentFonts } = flags
  let rules = '\nFormatting Rules:\n'

  if (enableBold || enableItalic || enableDifferentFonts || enableNewlines) {
    rules +=
      'Use ONLY the formatting tools listed below. Compose the phrase to suit these tools—do not use any markup that is not enabled.\n'
    if (enableNewlines) {
      rules +=
        '- Use newlines (\\n) to split the phrase into 2 or 3 lines to create a beautiful multi-line layout.\n'
    }
    if (enableBold) {
      rules += '- Wrap key concepts in double asterisks like **bold** to render them in bold.\n'
    }
    if (enableItalic) {
      rules += '- Wrap words in single asterisks like *italic* to render them in italics.\n'
    }
    if (enableDifferentFonts) {
      rules +=
        '- Wrap words in [font:FontName]text[/font] (do NOT include backticks or markdown code block quotes around this tag!) to render them in a different font style. Available fonts: "EB Garamond", "Playfair Display", "Outfit", "Garamond Bold", "Monospace". Use this sparingly (1-2 times max per phrase) to create visual contrast.\n'
    }
    const disabled: string[] = []
    if (!enableNewlines) disabled.push('newlines')
    if (!enableBold) disabled.push('**bold**')
    if (!enableItalic) disabled.push('*italic*')
    if (!enableDifferentFonts) disabled.push('[font:…] tags')
    if (disabled.length > 0) {
      rules += `Do NOT use: ${disabled.join(', ')}.\n`
    }
  } else {
    rules +=
      'Do NOT use any markdown tags, asterisks, brackets, font tags, or newlines in the output. Return ONLY the plain text phrase.\n'
  }

  return rules
}
