import { GoogleGenAI } from '@google/genai'
import { IPhraseGenerator } from '../../ports/IPhraseGenerator'
import { IConfigStore } from '../../ports/IConfigStore'

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
    
    const prompt = `You are a surrealist poet and conceptual artist.
Given a list of recent headlines from different news sources, create a single short, surreal, nonsense phrase in the style of a popular folk saying or proverb (like "Al que madruga, Dios lo ayuda" or "A mal tiempo, buena cara").

Guidelines:
1. The phrase must sound like a traditional proverb, rhythmic, brief, and structured (e.g., matching halves, advice-giving, or a lesson format) but completely surreal, nonsensical, and absurd.
2. It should weave and blend concepts, nouns, or verbs from DIFFERENT headlines and sources.
3. Keep it very short and punchy (maximum 8-12 words). The phrase will be displayed on a desktop wallpaper in a large font.
4. Respond in the language requested: "${language}". If "${language}" is "auto", detect and match the dominant language of the input headlines.
5. Return ONLY the generated phrase. Do not wrap in quotes, do not include markdown, do not write any prefixes (e.g., do not write "Proverb:"), and do not write any explanation.
6. Do NOT end the phrase with a period or any punctuation mark.

Headlines:
${headlines.map((h, i) => `- ${h}`).join('\n')}`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 1.0,
          topP: 0.95
        }
      })

      const text = response.text || ''
      return text
        .replace(/^["'“”‘«»]/, '')
        .replace(/["'“”‘«»]$/, '')
        .trim()
        .replace(/\.+$/, '')
        .trim()
    } catch (error) {
      console.error('GeminiPhraseGeneratorAdapter generation failed:', error)
      throw error
    }
  }
}
