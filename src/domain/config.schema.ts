import { z } from 'zod'

export const MonitorConfigSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  themeOverride: z.enum(['Midnight', 'Drift', 'Parchment', 'Blanc', 'Static', 'Forest', 'Crimson', 'Cyberpunk', 'WarmGlow']).optional()
})

export const MurmurConfigSchema = z.object({
  geminiApiKey: z.string().default(''),
  feeds: z.array(z.string().url()).min(1),
  refreshIntervalMinutes: z.number().int().min(5).max(1440).default(60),
  language: z.string().default('auto'),
  theme: z.enum(['Midnight', 'Drift', 'Parchment', 'Blanc', 'Static', 'Forest', 'Crimson', 'Cyberpunk', 'WarmGlow']).default('Midnight'),
  animation: z.enum(['Fade', 'DriftIn', 'Typewriter', 'Morph', 'Instant', 'Glitch']).default('Fade'),
  overlays: z.object({
    dateTime: z.boolean().default(true),
    sourceCredit: z.boolean().default(false),
    inspiringHeadlines: z.boolean().default(false)
  }),
  headlineSampleSize: z.number().int().min(5).max(50).default(15),
  launchAtLogin: z.boolean().default(false),
  fontFamily: z.enum(['EB Garamond', 'Playfair Display', 'Outfit', 'Garamond Bold', 'Monospace']).default('EB Garamond'),
  monitors: z.array(MonitorConfigSchema).default([]),
  textAlignment: z.enum(['center', 'left', 'right']).default('center'),
  layoutStyle: z.enum(['centered', 'scattered', 'editorial-left', 'editorial-right', 'asymmetrical', 'book-cover']).default('centered'),
  vignetteStyle: z.enum(['none', 'soft', 'medium', 'dramatic']).default('none'),
  audioFeedback: z.boolean().default(true),
  // Prompt & formatting fields
  systemPrompt: z.string().default(''),
  enableBold: z.boolean().default(true),
  enableItalic: z.boolean().default(true),
  enableNewlines: z.boolean().default(true),
  enableDifferentFonts: z.boolean().default(true)
})
