let generationCallCount = 0
let imagePromptCallCount = 0
let backgroundProviderCallCount = 0

export function incrementE2eGenerationCallCount(): void {
  generationCallCount += 1
}

export function getE2eGenerationCallCount(): number {
  return generationCallCount
}

export function resetE2eGenerationCallCount(): void {
  generationCallCount = 0
}

export function incrementE2eImagePromptCallCount(): void {
  imagePromptCallCount += 1
}

export function incrementE2eBackgroundProviderCallCount(): void {
  backgroundProviderCallCount += 1
}

export function getE2eBackgroundPipelineCounts(): { imagePrompt: number; provider: number } {
  return { imagePrompt: imagePromptCallCount, provider: backgroundProviderCallCount }
}

export function resetE2eBackgroundPipelineCounts(): void {
  imagePromptCallCount = 0
  backgroundProviderCallCount = 0
}
