export type ThemeName = 'Midnight' | 'Drift' | 'Parchment' | 'Blanc' | 'Static'
export type AnimationName = 'Fade' | 'DriftIn' | 'Typewriter' | 'Morph' | 'Instant'

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
  fontFamily: 'EB Garamond' | 'Playfair Display' | 'Outfit'
  monitors: MonitorConfig[]
  // New personalization fields
  textAlignment: 'center' | 'left' | 'right'
  layoutStyle: 'centered' | 'scattered' | 'editorial-left' | 'editorial-right'
  vignette: boolean
  noiseIntensity: 'none' | 'subtle' | 'heavy'
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
  // New paint parameters
  textAlignment: 'center' | 'left' | 'right'
  layoutStyle: 'centered' | 'scattered' | 'editorial-left' | 'editorial-right'
  vignette: boolean
  noiseIntensity: 'none' | 'subtle' | 'heavy'
  transitionProgress?: number
}

export interface MurmurState {
  isPaused: boolean
  lastRefreshTime?: string
  lastPhrases: Record<string, string>
}
