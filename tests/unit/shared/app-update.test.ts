import { describe, expect, it } from 'vitest'
import { shouldEnableAppUpdate, shouldNotifyForVersion } from '@shared/app-update'

describe('shouldEnableAppUpdate', () => {
  it('enables only for packaged non-E2E builds', () => {
    expect(shouldEnableAppUpdate(true, false)).toBe(true)
    expect(shouldEnableAppUpdate(false, false)).toBe(false)
    expect(shouldEnableAppUpdate(true, true)).toBe(false)
    expect(shouldEnableAppUpdate(false, true)).toBe(false)
  })
})

describe('shouldNotifyForVersion', () => {
  it('notifies only when version changes', () => {
    expect(shouldNotifyForVersion(null, '0.2.0')).toBe(true)
    expect(shouldNotifyForVersion('0.2.0', '0.2.0')).toBe(false)
    expect(shouldNotifyForVersion('0.1.0', '0.2.0')).toBe(true)
  })
})
