import { GoogleGenAI } from '@google/genai'
import { IPhraseGenerator } from '../../ports/IPhraseGenerator'
import { IConfigStore } from '../../ports/IConfigStore'
import { phraseToPlainText } from '../../shared/phrasePlainText'
import { buildPhraseFormattingRules } from '../../shared/geminiFormattingRules'

function isValidPoemSyntax(phrase: string): boolean {
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
    const ai = await this.getClient()
    const config = await this.configStore.get()

    const basePrompt = config.systemPrompt.trim()
    const formattingRules = buildPhraseFormattingRules(config)
    const prompt = `${basePrompt}${formattingRules}\nRespond in the language requested: "${language}". If "${language}" is "auto", detect and match the dominant language of the input headlines.\nReturn ONLY the generated phrase. Do NOT wrap in outer quotation marks, and do not include explanation or prefixes.\nDo NOT end with a period.\n\nHeadlines:\n${headlines.map((h) => `- ${h}`).join('\n')}`

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

        if (isValidPoemSyntax(text)) {
          return text
        }

        console.warn(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} returned invalid syntax: "${text}". Retrying...`)
      } catch (error) {
        console.error(`GeminiPhraseGeneratorAdapter: Attempt ${attempt} generation failed:`, error)
        if (attempt === maxAttempts) {
          throw error
        }
      }
    }

    console.warn(`GeminiPhraseGeneratorAdapter: All ${maxAttempts} attempts generated invalid syntax. Falling back to plain text.`)
    return phraseToPlainText(lastResponseText)
  }
}
