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
Given a list of recent headlines, create a single short, surreal, nonsense phrase (maximum 15-20 words) by juxtaposing and blending concepts, nouns, or verbs from different news.

Guidelines:
1. The phrase must feel poetic, dreamlike, or absurdly philosophical.
2. It should NOT simply concatenate headlines. It must weave a new, grammatically correct sentence.
3. Keep it brief. The phrase will be displayed on a desktop wallpaper in a large font.
4. Respond in the language requested: "${language}". If "${language}" is "auto", detect and match the dominant language of the input headlines.
5. Return ONLY the generated phrase. Do not wrap in quotes, do not include markdown, do not write any prefixes (e.g., do not write "Surreal phrase:"), and do not write any explanation.

Headlines:
${headlines.map((h, i) => `- ${h}`).join('\n')}`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
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
    } catch (error) {
      console.error('GeminiPhraseGeneratorAdapter generation failed:', error)
      throw error
    }
  }
}
