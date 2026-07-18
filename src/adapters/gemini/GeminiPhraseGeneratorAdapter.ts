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
    const config = await this.configStore.get()
    
    const basePrompt = config.systemPrompt.trim()
    
    // Append formatting rules dynamically based on configuration settings
    let formattingRules = '\nFormatting Rules:\n'
    if (config.enableBold || config.enableItalic || config.enableDifferentFonts || config.enableNewlines) {
      formattingRules += 'You are encouraged to use the following formatting tags in the output to make the phrase visually striking and artistic:\n'
      if (config.enableNewlines) {
        formattingRules += '- Use newlines (\\n) to split the phrase into 2 or 3 lines to create a beautiful multi-line layout.\n'
      }
      if (config.enableBold) {
        formattingRules += '- Wrap key concepts in double asterisks like **bold** to render them in bold.\n'
      }
      if (config.enableItalic) {
        formattingRules += '- Wrap words in single asterisks like *italic* to render them in italics.\n'
      }
      if (config.enableDifferentFonts) {
        formattingRules += '- Wrap words in `[font:FontName]text[/font]` to render them in a different font style. Available fonts: "EB Garamond", "Playfair Display", "Outfit", "Garamond Bold", "Monospace". Use this sparingly (1-2 times max per phrase) to create visual contrast.\n'
      }
    } else {
      formattingRules += 'Do NOT use any markdown tags, asterisks, brackets, or newlines in the output. Return ONLY the plain text phrase.\n'
    }

    const prompt = `${basePrompt}\n${formattingRules}\nRespond in the language requested: "${language}". If "${language}" is "auto", detect and match the dominant language of the input headlines.\nReturn ONLY the generated phrase. Do NOT wrap in outer quotation marks, and do not include explanation or prefixes.\nDo NOT end with a period.\n\nHeadlines:\n${headlines.map((h) => `- ${h}`).join('\n')}`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using gemini-2.5-flash for reliable follow-through on system prompt format directions!
        contents: prompt
      })

      const text = response.text || ''
      return text.trim()
    } catch (error) {
      console.error('GeminiPhraseGeneratorAdapter error generating phrase:', error)
      throw error
    }
  }
}
