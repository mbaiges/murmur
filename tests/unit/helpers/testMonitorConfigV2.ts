import { getDefaultMonitorProfile } from '../../../src/core/lib/config/defaultMonitorProfile'
import { createMonitorConfig } from '../../../src/core/lib/config/monitorProfiles'
import type { MurmurConfig } from '../../../src/core/domain/types'

export function testMonitorConfigV2(overrides?: Partial<MurmurConfig>): MurmurConfig {
  const profile = getDefaultMonitorProfile({
    feeds: ['https://feeds.com/rss'],
    headlineSampleSize: 5,
    language: 'en',
    systemPrompt: 'test prompt'
  })
  return {
    configVersion: 3,
    geminiApiKey: 'test-api-key',
    cloudflareAccountId: '',
    cloudflareApiToken: '',
    refreshIntervalMinutes: 60,
    launchAtLogin: false,
    monitors: [
      createMonitorConfig('screen-1', profile),
      { ...createMonitorConfig('screen-2', profile), enabled: false }
    ],
    ...overrides
  }
}
