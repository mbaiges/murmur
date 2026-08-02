import { describe, expect, it } from 'vitest'
import { migrateRawConfigToV2 } from '../../../../../src/core/lib/config/configMigrate'
import { MurmurConfigSchema } from '../../../../../src/core/domain/config.schema'

describe('configMigrate', () => {
  it('migrates v1 flat config to v2 with profile on monitors', () => {
    const raw = {
      geminiApiKey: 'key',
      feeds: ['https://example.com/rss'],
      theme: 'Drift',
      monitors: [{ id: '1', enabled: true, themeOverride: 'Forest' }],
      systemPrompt: 'hello'
    }
    const migrated = migrateRawConfigToV2(raw)
    const parsed = MurmurConfigSchema.parse(migrated)
    expect(parsed.configVersion).toBe(2)
    expect(parsed.monitors).toHaveLength(1)
    expect(parsed.monitors[0].profile.theme).toBe('Forest')
    expect(parsed.monitors[0].syncNews).toBe(true)
    expect(parsed.monitors[0].profile.feeds).toEqual(['https://example.com/rss'])
  })
})
