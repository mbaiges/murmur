export type ThemeName = 'Midnight' | 'Drift' | 'Parchment' | 'Blanc' | 'Static' | 'Forest' | 'Crimson' | 'Cyberpunk' | 'WarmGlow'
export type AnimationName = 'Fade' | 'DriftIn' | 'Typewriter' | 'Morph' | 'Instant' | 'Glitch'

export type LayoutStyleName =
  | 'centered'
  | 'scattered'
  | 'editorial-left'
  | 'editorial-right'
  | 'asymmetrical'
  | 'book-cover'
  | 'split-spread'
  | 'tabloid-stack'
  | 'pull-quote'
  | 'feature-opener'
  | 'sidebar-rail'
  | 'byline-lede'

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
  textAlignment: 'center' | 'left' | 'right'
  layoutStyle: LayoutStyleName
  vignetteStyle: 'none' | 'soft' | 'medium' | 'dramatic'
  audioFeedback: boolean
  systemPrompt: string
  enableBold: boolean
  enableItalic: boolean
  enableNewlines: boolean
  enableDifferentFonts: boolean
  noiseIntensity: 'none' | 'subtle' | 'heavy'
}

export interface RssItem {
  title: string
  source: string
  feedUrl: string
}

export interface LayoutContentEnvelope {
  schemaId: string
  layoutStyle: LayoutStyleName
  payload: Record<string, string>
}

export interface PaintOptions {
  phrase: string
  layoutContent?: LayoutContentEnvelope
  theme: ThemeName
  fontFamily: string
  animation: AnimationName
  overlays: OverlayConfig
  resolution: { width: number; height: number }
  headlines?: string[]
  sources?: string[]
  textAlignment: 'center' | 'left' | 'right'
  layoutStyle: LayoutStyleName
  vignetteStyle: 'none' | 'soft' | 'medium' | 'dramatic'
  noiseIntensity: 'none' | 'subtle' | 'heavy'
  audioFeedback: boolean
  enableBold: boolean
  enableItalic: boolean
  enableNewlines: boolean
  enableDifferentFonts: boolean
  transitionProgress?: number
}

export interface MurmurState {
  isPaused: boolean
  lastRefreshTime?: string
  lastPhrases: Record<string, string>
  lastContent: Record<string, LayoutContentEnvelope>
  lastHeadlines?: Record<string, string[]>
  lastSources?: Record<string, string[]>
  lastGenerationError?: string
}
