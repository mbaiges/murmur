import { describe, expect, it } from 'vitest'
import {
  appUpdateModeForPlatform,
  isNewerReleaseVersion,
  shouldEnableAppUpdate,
  shouldNotifyForVersion
} from '@shared/app-update'

describe('appUpdateModeForPlatform', () => {
  it('uses in-app updates on Windows only', () => {
    expect(appUpdateModeForPlatform('win32')).toBe('in-app')
    expect(appUpdateModeForPlatform('darwin')).toBe('manual-releases')
    expect(appUpdateModeForPlatform('linux')).toBe('manual-releases')
  })
})

describe('isNewerReleaseVersion', () => {
  it('compares semver segments', () => {
    expect(isNewerReleaseVersion('0.2.0', '0.1.0')).toBe(true)
    expect(isNewerReleaseVersion('v0.1.1', '0.1.0')).toBe(true)
    expect(isNewerReleaseVersion('0.1.0', '0.1.0')).toBe(false)
    expect(isNewerReleaseVersion('0.1.0', '0.2.0')).toBe(false)
  })
})

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
