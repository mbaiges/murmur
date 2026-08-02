import type { MurmurConfig } from '@core/domain/types'
import {
  CYBERPUNK_TERMINAL_PROMPT,
  GOTHIC_PURPLE_PROSE_PROMPT,
  WORST_NEWS_TITLE_PROMPT,
  ZEN_KOAN_PROMPT
} from '@core/domain/types'

export function activeMoodPresetLabel(config: MurmurConfig): string {
  if (
    config.systemPrompt === CYBERPUNK_TERMINAL_PROMPT &&
    config.theme === 'Cyberpunk' &&
    config.fontFamily === 'Monospace' &&
    config.layoutStyle === 'editorial-left' &&
    config.animation === 'Typewriter' &&
    config.audioFeedback === true &&
    config.vignetteStyle === 'dramatic' &&
    config.noiseIntensity === 'heavy'
  ) {
    return 'Rogue Terminal'
  }
  if (
    config.systemPrompt === ZEN_KOAN_PROMPT &&
    config.theme === 'Parchment' &&
    config.fontFamily === 'EB Garamond' &&
    config.layoutStyle === 'book-cover' &&
    config.animation === 'Fade' &&
    config.audioFeedback === false &&
    config.vignetteStyle === 'soft' &&
    config.noiseIntensity === 'subtle'
  ) {
    return 'Zen Study'
  }
  if (
    config.systemPrompt === GOTHIC_PURPLE_PROSE_PROMPT &&
    config.theme === 'Drift' &&
    config.fontFamily === 'Playfair Display' &&
    config.layoutStyle === 'asymmetrical' &&
    config.animation === 'DriftIn' &&
    config.audioFeedback === false &&
    config.vignetteStyle === 'dramatic' &&
    config.noiseIntensity === 'subtle'
  ) {
    return 'Gothic Novelist'
  }
  if (
    config.systemPrompt === WORST_NEWS_TITLE_PROMPT &&
    config.theme === 'Crimson' &&
    config.fontFamily === 'Outfit' &&
    config.layoutStyle === 'centered' &&
    config.animation === 'Fade' &&
    config.audioFeedback === false &&
    config.vignetteStyle === 'none' &&
    config.noiseIntensity === 'none'
  ) {
    return 'Clickbait Press'
  }
  return 'Custom'
}
