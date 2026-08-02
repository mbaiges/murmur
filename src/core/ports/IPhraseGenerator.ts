import { LayoutContentSpec } from '../lib/layoutContentSpecs'
import { LayoutStyleName } from '../domain/types'
import { PhraseFormatFlags } from '../lib/phraseFormatFlags'

export interface PhraseGenerationRequest {
  headlines: string[]
  language: string
  systemPrompt: string
  contentSpec: LayoutContentSpec
  formatFlags: PhraseFormatFlags
}

export interface PhraseGenerationResult {
  schemaId: string
  layoutStyle: LayoutStyleName
  rawJson: string
  payload: Record<string, string>
}

export interface IPhraseGenerator {
  generate(headlines: string[], language: string): Promise<string>
  generateStructured(request: PhraseGenerationRequest): Promise<PhraseGenerationResult>
}
