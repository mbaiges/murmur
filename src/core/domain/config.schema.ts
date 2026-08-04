import { z } from 'zod'

const themeEnum = z.enum([
  'Midnight',
  'Drift',
  'Parchment',
  'Blanc',
  'Static',
  'Forest',
  'Crimson',
  'Cyberpunk',
  'WarmGlow'
])

export const MonitorProfileSchema = z.object({
  feeds: z.array(z.string().url()),
  language: z.string().default('auto'),
  theme: themeEnum.default('Midnight'),
  animation: z.enum(['Fade', 'DriftIn', 'Typewriter', 'Morph', 'Instant', 'Glitch']).default('Fade'),
  overlays: z
    .object({
      dateTime: z.boolean().default(true),
      sourceCredit: z.boolean().default(false),
      inspiringHeadlines: z.boolean().default(false),
      phraseWidget: z.boolean().default(false)
    })
    .default({ dateTime: true, sourceCredit: false, inspiringHeadlines: false, phraseWidget: false }),
  headlineSampleSize: z.number().int().min(5).max(50).default(15),
  fontFamily: z
    .enum(['EB Garamond', 'Playfair Display', 'Outfit', 'Garamond Bold', 'Monospace'])
    .default('EB Garamond'),
  textAlignment: z.enum(['center', 'left', 'right']).default('center'),
  layoutStyle: z
    .enum([
      'centered',
      'scattered',
      'editorial-left',
      'editorial-right',
      'asymmetrical',
      'book-cover',
      'split-spread',
      'tabloid-stack',
      'pull-quote',
      'feature-opener',
      'sidebar-rail',
      'byline-lede'
    ])
    .default('centered'),
  vignetteStyle: z.enum(['none', 'soft', 'medium', 'dramatic']).default('none'),
  audioFeedback: z.boolean().default(true),
  systemPrompt: z.string().default(''),
  enableBold: z.boolean().default(true),
  enableItalic: z.boolean().default(true),
  enableNewlines: z.boolean().default(true),
  enableDifferentFonts: z.boolean().default(false),
  noiseIntensity: z.enum(['none', 'subtle', 'heavy']).default('none'),
  tonePreset: z.enum(['none', 'neutral', 'professional', 'vulgar', 'custom']).default('none'),
  customToneText: z.string().default(''),
  backgroundMode: z.enum(['gradient', 'photo', 'ai']).default('gradient'),
  backgroundPresetId: z
    .enum([
      'Abstract mood',
      'Editorial paper',
      'Warm film grain',
      'Absurd connections',
      'Cyberpunk neon haze',
      'Zen mist',
      'Gothic violet fog',
      'Tabloid flash',
      'Custom'
    ])
    .default('Abstract mood'),
  customBackgroundPrompt: z.string().max(2048).default(''),
  backgroundPhotoRelPath: z.string().default(''),
  aiPhraseInImage: z.boolean().default(false),
  aiPhraseInImagePreset: z
    .enum([
      'word-art',
      'poem',
      'book-quote',
      'match-prompt-tone',
      'neon-sign',
      'newspaper-headline',
      'graffiti-tag',
      'minimalist-caption',
      'cinematic-subtitle'
    ])
    .default('poem'),
  showHeroPhrase: z.boolean().default(true)
})

export const MonitorConfigSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  syncNews: z.boolean().default(true),
  syncVoice: z.boolean().default(true),
  syncStyle: z.boolean().default(true),
  profile: MonitorProfileSchema
})

export const MurmurConfigSchema = z
  .object({
    configVersion: z.literal(3).default(3),
    geminiApiKey: z.string().default(''),
    cloudflareAccountId: z.string().default(''),
    cloudflareApiToken: z.string().default(''),
    refreshIntervalMinutes: z.number().int().min(5).max(1440).default(60),
    launchAtLogin: z.boolean().default(false),
    monitors: z.array(MonitorConfigSchema).default([])
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.monitors.length; i++) {
      const m = data.monitors[i]
      if (m.enabled && m.profile.feeds.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monitors', i, 'profile', 'feeds'],
          message: 'Enabled display requires at least one feed'
        })
      }
      if (m.profile.tonePreset === 'custom' && m.profile.customToneText.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monitors', i, 'profile', 'customToneText'],
          message: 'Custom tone requires non-empty text'
        })
      }
      if (
        m.profile.backgroundPresetId === 'Custom' &&
        m.profile.customBackgroundPrompt.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monitors', i, 'profile', 'customBackgroundPrompt'],
          message: 'Custom background prompt requires non-empty text'
        })
      }
      if (m.profile.backgroundMode === 'photo' && m.profile.backgroundPhotoRelPath.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monitors', i, 'profile', 'backgroundPhotoRelPath'],
          message: 'Photo background requires an imported image'
        })
      }
    }
  })
