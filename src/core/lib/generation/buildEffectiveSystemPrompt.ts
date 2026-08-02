export function buildEffectiveSystemPrompt(systemPrompt: string, toneInstruction: string | null): string {
  const base = systemPrompt.trim()
  if (!toneInstruction?.trim()) {
    return base
  }
  return `${base}\n\nTone and delivery (follow strictly):\n${toneInstruction.trim()}`
}
