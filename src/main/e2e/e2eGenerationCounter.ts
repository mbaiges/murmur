let generationCallCount = 0

export function incrementE2eGenerationCallCount(): void {
  generationCallCount += 1
}

export function getE2eGenerationCallCount(): number {
  return generationCallCount
}

export function resetE2eGenerationCallCount(): void {
  generationCallCount = 0
}
