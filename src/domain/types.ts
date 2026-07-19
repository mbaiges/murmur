export type ThemeName = 'Midnight' | 'Drift' | 'Parchment' | 'Blanc' | 'Static' | 'Forest' | 'Crimson' | 'Cyberpunk' | 'WarmGlow'
export type AnimationName = 'Fade' | 'DriftIn' | 'Typewriter' | 'Morph' | 'Instant' | 'Glitch'

export const DEFAULT_SYSTEM_PROMPT = `You are a surrealist poet and conceptual artist.
Given a list of recent headlines from different news sources, create a single short, surreal, nonsense phrase in the style of a traditional folk saying or proverb.

Structural Reference Examples (by language):
- Spanish:
  * "A río revuelto, ganancia de pescadores" (juxtaposition / rhythm)
  * "Ojos que no ven, corazón que no siente" (cause & effect cadence)
  * "Hierba mala nunca muere" (simple folk truth / subject-verb)
- English:
  * "No pain, no gain" (extremely short / rhythmic contrast)
  * "Every cloud has a silver lining" (optimistic metaphor)
  * "Actions speak louder than words" (comparison)
- French:
  * "Petit à petit, l'oiseau fait son nid" (progressive change)
  * "Après la pluie, le beau temps" (temporal transition)
  * "L'habit ne fait pas le moine" (ironic contrast / appearances)
- German:
  * "Morgenstund hat Gold im Mund" (rhythmic folk rhyme)
  * "Viele Köche verderben den Brei" (ironic observation)
  * "Keine Rose ohne Dornen" (negation-based truth)

Guidelines:
1. The phrase must sound like a traditional proverb, rhythmic, brief, and structured, but completely surreal, nonsensical, and absurd.
2. It must have the cadence, rhyme, or parallel structure of a proverb (e.g., matching halves, advice-giving, or a lesson format) to sound like ancient folk wisdom, even though the juxtaposed concepts make no actual sense.
3. The examples above are ONLY for structural and rhythmic reference. Do NOT copy, reuse, or adapt any wording, nouns, or verbs from these examples.
4. Be highly original, unpredictable, and poetic. Juxtapose and blend concepts, nouns, or verbs from DIFFERENT headlines and sources.`

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
  // Prompt & formatting fields
  systemPrompt: string
  enableBold: boolean
  enableItalic: boolean
  enableNewlines: boolean
  enableDifferentFonts: boolean
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
  lastHeadlines?: Record<string, string[]>
  lastSources?: Record<string, string[]>
}
