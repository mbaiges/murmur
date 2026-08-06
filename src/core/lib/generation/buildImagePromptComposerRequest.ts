import type { MonitorProfile } from '../../domain/types'
import { buildEffectiveSystemPrompt } from './buildEffectiveSystemPrompt'
import { resolveToneInstruction } from './toneInstructions'
import {
  applyBackgroundTemplate,
  resolveBackgroundTemplateSource,
  resolveBackgroundTemplateVariables,
  ensureBackgroundNoTextClause
} from '../presets/backgroundPromptPresets'
import {
  aiPhraseInImagePresetInstruction,
  isAiPhraseIntegrated
} from '../presets/aiPhraseInImagePresets'

export type ImagePromptTemplateContext = {
  sampleTitles: string[]
  phrase: string
}

export function buildResolvedBackgroundPromptText(
  profile: MonitorProfile,
  context: ImagePromptTemplateContext
): string {
  const template = resolveBackgroundTemplateSource(profile)
  const variables = resolveBackgroundTemplateVariables(profile)
  const resolved = applyBackgroundTemplate(
    template,
    variables,
    context,
    profile.backgroundTemplateVars ?? {}
  )
  if (isAiPhraseIntegrated(profile)) {
    return resolved.trim()
  }
  return ensureBackgroundNoTextClause(resolved)
}

export function buildImagePromptComposeUserMessage(
  profile: MonitorProfile,
  context: ImagePromptTemplateContext
): string {
  const resolved = buildResolvedBackgroundPromptText(profile, context)

  if (isAiPhraseIntegrated(profile)) {
    const toneInstruction = resolveToneInstruction(profile)
    const systemPrompt = buildEffectiveSystemPrompt(profile.systemPrompt, toneInstruction)
    const phraseBlock = aiPhraseInImagePresetInstruction(
      profile.aiPhraseInImagePreset,
      context.phrase,
      {
        systemPrompt,
        toneInstruction
      }
    )

    return `You write a single text-to-image prompt for a desktop wallpaper.

Rules:
- Output ONLY the image prompt text, no quotes around the whole prompt, no markdown, no explanation.
- The generated image MUST include readable text as specified below (this is intentional).
- You MUST embed the COMPLETE phrase in your output prompt: same words, same language, same punctuation, same order. Never shorten, paraphrase, summarize, or show only the first few words (e.g. never reduce a long Spanish sentence to a celebrity name).
- Copy the full phrase into the image prompt as text that FLUX must paint (use line breaks in the prompt if needed for layout).
- Keep the prompt under 400 words.
- Follow the scene/mood instructions and the phrase typography instructions.
- If scene instructions mention "no text" or "do not quote", those apply only to decorative headline samples — they do NOT override the required full phrase typography.

Scene and mood (visual atmosphere only; phrase text is still required verbatim below):
${resolved}

Phrase in the image (required — entire string, verbatim):
${phraseBlock}`
  }

  return `You write a single text-to-image prompt for a desktop wallpaper.

Rules:
- Output ONLY the image prompt text, no quotes, no markdown, no explanation.
- The image must be purely visual: NO readable text, letters, numbers, words, captions, typography, logos, or watermarks anywhere.
- Headlines and phrase in the instructions are mood/context only — never render them as text in the image.
- Keep the prompt under 400 words.
- Follow the instructions below.

Instructions:
${resolved}`
}
