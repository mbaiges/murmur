export interface IPhraseGenerator {
  generate(headlines: string[], language: string): Promise<string>
}
