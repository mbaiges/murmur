import { GoogleGenAI } from '@google/genai'
import { IPhraseGenerator } from '../../ports/IPhraseGenerator'
import { IConfigStore } from '../../ports/IConfigStore'
import { MurmurConfig } from '../../domain/types'

function isValidPoemSyntax(phrase: string, config: MurmurConfig): boolean {
  if (!phrase) return false

  // 1. Validate Bold (**): count must be even
  if (config.enableBold) {
    const boldCount = (phrase.split('**').length - 1)
    if (boldCount % 2 !== 0) return false
  }

  // 2. Validate Italic (*): count of single * after removing ** must be even
  if (config.enableItalic) {
    const withoutBold = phrase.replace(/\*\*/g, '')
    const italicCount = (withoutBold.split('*').length - 1)
    if (italicCount % 2 !== 0) return false
  }

  // 3. Validate Code Backticks (`): count must be even
  if (config.enableDifferentFonts) {
    const codeCount = (phrase.split('`').length - 1)
    if (codeCount % 2 !== 0) return false
  }

  // 4. Validate Font Tags ([font:Name] ... [/font])
  if (config.enableDifferentFonts) {
    const openMatches = phrase.match(/\[font:/g) || []
    const closeMatches = phrase.match(/\[\/font\]/g) || []
    if (openMatches.length !== closeMatches.length) return false

    // Validate that all font names are supported
    const fontRegex = /\[font:([^\]]+)\]/g
    let match
    const allowedFonts = ['EB Garamond', 'Playfair Display', 'Outfit', 'Garamond Bold', 'Monospace']
    while ((match = fontRegex.exec(phrase)) !== null) {
      if (!allowedFonts.includes(match[1])) {
        return false
      }
    }
  }

  return true
}

function stripPoemTags(phrase: string): string {
  return phrase
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[font:[^\]]+\]/g, '')
    .replace(/\[\/font\]/g, '')
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

    const maxAttempts = 3
    let lastResponseText = ''

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt
        })

        const text = (response.text || '').trim()
        lastResponseText = text

        if (isValidPoemSyntax(text, config)) {
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

    // Fallback if all retries generated invalid tags: strip the tags so we never display broken syntax on the screen!
    console.warn(`GeminiPhraseGeneratorAdapter: All ${maxAttempts} attempts generated invalid syntax. Falling back to plain text.`)
    return stripPoemTags(lastResponseText)
  }
}
