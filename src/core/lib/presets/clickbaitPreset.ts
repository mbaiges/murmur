import { MurmurConfig, WORST_NEWS_TITLE_PROMPT } from '../../domain/types'

export function isClickbaitPressConfig(config: {
  systemPrompt?: string
  theme?: string
  fontFamily?: string
  layoutStyle?: string
  animation?: string
  audioFeedback?: boolean
  vignetteStyle?: string
  noiseIntensity?: string
}): boolean {
  return (
    config.systemPrompt === WORST_NEWS_TITLE_PROMPT &&
    config.theme === 'Crimson' &&
    config.fontFamily === 'Outfit' &&
    config.layoutStyle === 'centered' &&
    config.audioFeedback === false &&
    config.vignetteStyle === 'none' &&
    config.noiseIntensity === 'none'
  )
}

/** Clickbait Press used Instant Cut, which hides the live overlay on macOS. */
export function preferredClickbaitAnimation(): 'Fade' {
  return 'Fade'
}
