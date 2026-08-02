import { LayoutContentSpec } from '../layout/layoutContentSpecs'
import { buildPhraseFormattingRules } from './geminiFormattingRules'
import { PhraseFormatFlags } from '../phrase/phraseFormatFlags'

export function buildStructuredPhrasePrompt(
  spec: LayoutContentSpec,
  headlines: string[],
  language: string,
  systemPrompt: string,
  formatFlags: PhraseFormatFlags
): string {
  const formattingRules = buildPhraseFormattingRules(formatFlags)
  const fieldLines = spec.fields.map((f) => {
    const req = f.required ? 'required' : 'optional'
    const typeNote = f.type === 'markdown' ? 'markdown string' : 'plain string'
    const hint = f.promptHint ? ` ${f.promptHint}` : ''
    return `- "${f.key}" (${req}, ${typeNote}): ${f.description}.${hint}`
  })

  const keysJson = spec.fields.map((f) => `"${f.key}"`).join(', ')

  return `${systemPrompt.trim()}${formattingRules}

You are generating structured content for layout "${spec.layoutStyle}" (schema ${spec.schemaId}).

Return ONLY a single JSON object with these keys: ${keysJson}.
Do not wrap in markdown code fences. Do not include explanation or prefixes.

Fields:
${fieldLines.join('\n')}

Language: respond in "${language}". If "${language}" is "auto", match the dominant language of the headlines.
Follow the Formatting Rules above for periods and line breaks. Separate sentences with periods when needed; do not break lines around proper names.

Headlines:
${headlines.map((h) => `- ${h}`).join('\n')}`
}
