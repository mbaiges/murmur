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
Given a list of recent headlines from different news sources, create a single short, surreal, nonsense phrase in the style of a traditional folk saying or proverb.

Structural Reference Examples (by language):
- Spanish:
  * "A río revuelto, ganancia de pescadores" (juxtaposition / rhythm)
  * "Ojos que no ven, corazón que no siente" (cause & effect cadence)
  * "Hierba mala nunca muere" (simple folk truth / subject-verb)
- English:
  * "No pain, no gain" (extremely short / rhythmic contrast)
  * "Every cloud has a silver lining" (optimistic metaphor)
  * "Actions speak louder than words" (comparison)
- French:
  * "Petit à petit, l'oiseau fait son nid" (progressive change)
  * "Après la pluie, le beau temps" (temporal transition)
  * "L'habit ne fait pas le moine" (ironic contrast / appearances)
- German:
  * "Morgenstund hat Gold im Mund" (rhythmic folk rhyme)
  * "Viele Köche verderben den Brei" (ironic observation)
  * "Keine Rose ohne Dornen" (negation-based truth)

Guidelines:
1. The phrase must sound like a traditional proverb, rhythmic, brief, and structured, but completely surreal, nonsensical, and absurd.
2. It must have the cadence, rhyme, or parallel structure of a proverb (e.g., matching halves, advice-giving, or a lesson format) to sound like ancient folk wisdom, even though the juxtaposed concepts make no actual sense.
3. The examples above are ONLY for structural and rhythmic reference. Do NOT copy, reuse, or adapt any wording, nouns, or verbs from these examples.
4. Be highly original, unpredictable, and poetic. Juxtapose and blend concepts, nouns, or verbs from DIFFERENT headlines and sources.
5. Keep it very short and punchy (maximum 8-12 words). The phrase will be displayed on a desktop wallpaper in a large font.
6. Respond in the language requested: "${language}". If "${language}" is "auto", detect and match the dominant language of the input headlines.
7. Return ONLY the generated phrase. Do not wrap in quotes, do not include markdown, do not write any prefixes (e.g., do not write "Proverb:"), and do not write any explanation.
8. Do NOT end the phrase with a period or any punctuation mark.

Headlines:
${headlines.map((h, i) => `- ${h}`).join('\n')}`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 1.1,
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
