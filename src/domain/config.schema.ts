import { z } from 'zod'

export const MonitorConfigSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  themeOverride: z.enum(['Midnight', 'Drift', 'Parchment', 'Blanc', 'Static']).optional()
})

export const MurmurConfigSchema = z.object({
  geminiApiKey: z.string().default(''),
  feeds: z.array(z.string().url()).min(1),
  refreshIntervalMinutes: z.number().int().min(5).max(1440).default(60),
  language: z.string().default('auto'),
  theme: z.enum(['Midnight', 'Drift', 'Parchment', 'Blanc', 'Static']).default('Midnight'),
  animation: z.enum(['Fade', 'DriftIn', 'Typewriter', 'Morph', 'Instant']).default('Fade'),
  overlays: z.object({
    dateTime: z.boolean().default(true),
    sourceCredit: z.boolean().default(false),
    inspiringHeadlines: z.boolean().default(false)
  }),
  headlineSampleSize: z.number().int().min(5).max(50).default(15),
  launchAtLogin: z.boolean().default(false),
  fontFamily: z.enum(['EB Garamond', 'Playfair Display', 'Outfit']).default('EB Garamond'),
  monitors: z.array(MonitorConfigSchema).default([])
})
