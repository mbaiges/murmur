export type ThemeName = 'Midnight' | 'Drift' | 'Parchment' | 'Blanc' | 'Static' | 'Forest' | 'Crimson' | 'Cyberpunk' | 'WarmGlow'
export type AnimationName = 'Fade' | 'DriftIn' | 'Typewriter' | 'Morph' | 'Instant' | 'Glitch'

export type BackgroundMode = 'gradient' | 'photo' | 'ai'

export type BackgroundPresetId =
  | 'Abstract mood'
  | 'Editorial paper'
  | 'Warm film grain'
  | 'Absurd connections'
  | 'Cyberpunk neon haze'
  | 'Zen mist'
  | 'Gothic violet fog'
  | 'Tabloid flash'
  | 'Custom'

export type AiPhraseInImagePreset =
  | 'word-art'
  | 'poem'
  | 'book-quote'
  | 'match-prompt-tone'
  | 'neon-sign'
  | 'newspaper-headline'
  | 'graffiti-tag'
  | 'minimalist-caption'
  | 'cinematic-subtitle'

export type TonePreset = 'none' | 'neutral' | 'professional' | 'vulgar' | 'custom'

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
  phraseWidget: boolean
}

export interface MonitorProfile {
  feeds: string[]
  language: string
  theme: ThemeName
  animation: AnimationName
  overlays: OverlayConfig
  headlineSampleSize: number
  fontFamily: 'EB Garamond' | 'Playfair Display' | 'Outfit' | 'Garamond Bold' | 'Monospace'
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
  tonePreset: TonePreset
  customToneText: string
  backgroundMode: BackgroundMode
  backgroundPresetId: BackgroundPresetId
  customBackgroundPrompt: string
  backgroundPhotoRelPath: string
  aiPhraseInImage: boolean
  aiPhraseInImagePreset: AiPhraseInImagePreset
  /** When false, Murmur does not draw the large center headline (AI art-only layouts). */
  showHeroPhrase: boolean
}

export interface MonitorConfig {
  id: string
  enabled: boolean
  syncNews: boolean
  syncVoice: boolean
  syncStyle: boolean
  profile: MonitorProfile
}

export interface MurmurConfig {
  configVersion: 3
  geminiApiKey: string
  cloudflareAccountId: string
  cloudflareApiToken: string
  refreshIntervalMinutes: number
  launchAtLogin: boolean
  monitors: MonitorConfig[]
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
  backgroundMode?: BackgroundMode
  baseImagePath?: string
  fontFamily: string
  animation: AnimationName
  overlays: OverlayConfig
  resolution: { width: number; height: number }
  headlines?: string[]
  sources?: string[]
  /** When false, skip center headline layout (phrase may still show in bottom widget). */
  paintHeroPhrase?: boolean
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
