import { describe, expect, it } from 'vitest'
import {
  murmurBackgroundAssetUrl,
  parseMurmurBackgroundAssetUrl
} from '../../../../../src/core/lib/background/backgroundAssetUrl'

describe('backgroundAssetUrl', () => {
  it('builds path-style URLs safe for numeric monitor ids', () => {
    expect(murmurBackgroundAssetUrl('1', 'ai')).toBe('murmur-background://bg/1/ai')
    expect(murmurBackgroundAssetUrl('1', 'ai', '3:04:05 AM')).toContain('murmur-background://bg/1/ai?v=')
  })

  it('parses path-style and legacy hostname URLs', () => {
    expect(parseMurmurBackgroundAssetUrl('murmur-background://bg/1/ai?v=x')).toEqual({
      monitorId: '1',
      kind: 'ai'
    })
    expect(parseMurmurBackgroundAssetUrl('murmur-background://stub-monitor/personal')).toEqual({
      monitorId: 'stub-monitor',
      kind: 'personal'
    })
  })
})
