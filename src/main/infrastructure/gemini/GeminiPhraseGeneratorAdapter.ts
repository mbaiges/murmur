import { GoogleGenAI } from '@google/genai'
import { IPhraseGenerator, PhraseGenerationRequest, PhraseGenerationResult } from '../../../core/ports/IPhraseGenerator'
import { IConfigStore } from '../../../core/ports/IConfigStore'
import { phraseToPlainText } from '../../../core/lib/phrase/phrasePlainText'
import { buildPhraseFormattingRules } from '../../../core/lib/generation/geminiFormattingRules'
import { buildStructuredPhrasePrompt } from '../../../core/lib/generation/StructuredPhrasePromptBuilder'
import { validateLayoutPayload } from '../../../core/lib/layout/layoutSpecToZod'
import { isValidPoemSyntax, validateMarkdownFields } from '../../../core/lib/phrase/phraseSyntaxValidation'
import { getLayoutContentSpec } from '../../../core/lib/layout/layoutContentSpecs'
import { envelopeToRawJson } from '../../../core/lib/layout/layoutContentParse'
import { LayoutContentEnvelope } from '../../../core/domain/types'

export class GeminiPhraseGeneratorAdapter implements IPhraseGenerator {
  constructor(private readonly configStore: IConfigStore) {}

  private async getClient(): Promise<GoogleGenAI> {
    const config = await this.configStore.get()
    if (!config.geminiApiKey) {
      throw new Error('GeminiPhraseGeneratorAdapter: API key is not configured')
    }
    return new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    })
  }

  public async generate(headlines: string[], language: string): Promise<string> {
    const config = await this.configStore.get()
    const spec = getLayoutContentSpec(config.layoutStyle)
    const result = await this.generateStructured({
      headlines,
      language,
      systemPrompt: config.systemPrompt,
      contentSpec: spec,
      formatFlags: {
        enableBold: config.enableBold,
        enableItalic: config.enableItalic,
        enableNewlines: config.enableNewlines,
        enableDifferentFonts: config.enableDifferentFonts
      }
    })
    return result.payload.phrase ?? Object.values(result.payload)[0] ?? ''
  }

  public async generateStructured(request: PhraseGenerationRequest): Promise<PhraseGenerationResult> {
    const ai = await this.getClient()
    const prompt = buildStructuredPhrasePrompt(
      request.contentSpec,
      request.headlines,
      request.language,
      request.systemPrompt,
      request.formatFlags
    )

    const maxAttempts = 5
    let lastResponseText = ''

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt
        })

        const text = (response.text || '').trim()
        lastResponseText = text

        const jsonText = extractJsonObject(text)
        if (!jsonText) {
          console.warn(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} missing JSON object`)
          continue
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(jsonText)
        } catch {
          console.warn(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} invalid JSON`)
          continue
        }

        const validated = validateLayoutPayload(request.contentSpec, parsed)
        if (!validated.success) {
          console.warn(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} schema fail: ${validated.error}`)
          continue
        }

        if (!validateMarkdownFields(request.contentSpec, validated.payload)) {
          console.warn(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} invalid markdown in payload`)
          continue
        }

        const envelope: LayoutContentEnvelope = {
          schemaId: request.contentSpec.schemaId,
          layoutStyle: request.contentSpec.layoutStyle,
          payload: validated.payload
        }

        return {
          schemaId: request.contentSpec.schemaId,
          layoutStyle: request.contentSpec.layoutStyle,
          rawJson: envelopeToRawJson(envelope),
          payload: validated.payload
        }
      } catch (error) {
        console.error(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} generation failed:`, error)
        if (attempt === maxAttempts) {
          throw error
        }
      }
    }

    throw new Error(
      `GeminiPhraseGeneratorAdapter: Could not produce valid structured content after ${maxAttempts} attempts. Last: ${phraseToPlainText(lastResponseText).slice(0, 80)}`
    )
  }
}

function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1)
  }
  return null
}

/** @deprecated exported for legacy tests referencing poem syntax */
export { isValidPoemSyntax }
