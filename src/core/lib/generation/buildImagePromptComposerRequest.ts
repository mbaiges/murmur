export function buildImagePromptComposerUserMessage(headlines: string[], instructions: string): string {
  const headlineBlock =
    headlines.length > 0
      ? headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : '(No headlines available this refresh.)'

  return `You write a single text-to-image prompt for a desktop wallpaper.

Rules:
- Output ONLY the image prompt text, no quotes, no markdown, no explanation.
- The image must contain NO readable text, letters, logos, or watermarks.
- Keep the prompt under 400 words.
- Follow the style instructions below.
- Let today's headlines subtly influence mood, color, and metaphor (do not quote headlines verbatim).

Style instructions:
${instructions.trim()}

Today's headlines:
${headlineBlock}`
}
