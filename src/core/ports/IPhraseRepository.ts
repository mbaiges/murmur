import { LayoutContentSpec } from '../lib/layout/layoutContentSpecs'
import { LayoutStyleName } from '../domain/types'
import { PhraseFormatFlags } from '../lib/phrase/phraseFormatFlags'

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

export interface IPhraseRepository {
  generate(headlines: string[], language: string): Promise<string>
  generateStructured(request: PhraseGenerationRequest): Promise<PhraseGenerationResult>
}
