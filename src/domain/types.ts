export type ThemeName = 'Midnight' | 'Drift' | 'Parchment' | 'Blanc' | 'Static' | 'Forest' | 'Crimson' | 'Cyberpunk' | 'WarmGlow'
export type AnimationName = 'Fade' | 'DriftIn' | 'Typewriter' | 'Morph' | 'Instant' | 'Glitch'

export interface OverlayConfig {
  dateTime: boolean
  sourceCredit: boolean
  inspiringHeadlines: boolean
}

export interface MonitorConfig {
  id: string
  enabled: boolean
  themeOverride?: ThemeName
}

export interface MurmurConfig {
  geminiApiKey: string
  feeds: string[]
  refreshIntervalMinutes: number
  language: string
  theme: ThemeName
  animation: AnimationName
  overlays: OverlayConfig
  headlineSampleSize: number
  launchAtLogin: boolean
  fontFamily: 'EB Garamond' | 'Playfair Display' | 'Outfit' | 'Garamond Bold' | 'Monospace'
  monitors: MonitorConfig[]
  // Personalization fields
  textAlignment: 'center' | 'left' | 'right'
  layoutStyle: 'centered' | 'scattered' | 'editorial-left' | 'editorial-right' | 'asymmetrical' | 'book-cover'
  vignetteStyle: 'none' | 'soft' | 'medium' | 'dramatic'
  audioFeedback: boolean
}

export interface RssItem {
  title: string
  source: string
  feedUrl: string
}

export interface PaintOptions {
  phrase: string
  theme: ThemeName
  fontFamily: string
  animation: AnimationName
  overlays: OverlayConfig
  resolution: { width: number; height: number }
  headlines?: string[]
  sources?: string[]
  textAlignment: 'center' | 'left' | 'right'
  layoutStyle: 'centered' | 'scattered' | 'editorial-left' | 'editorial-right' | 'asymmetrical' | 'book-cover'
  vignetteStyle: 'none' | 'soft' | 'medium' | 'dramatic'
  audioFeedback: boolean
  transitionProgress?: number
}

export interface MurmurState {
  isPaused: boolean
  lastRefreshTime?: string
  lastPhrases: Record<string, string>
}
