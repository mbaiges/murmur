import { describe, it, expect, vi, beforeEach } from 'vitest'
import { join } from 'path'
import { MacDesktopWallpaperAdapter } from '../../../../../src/main/infrastructure/wallpaper/MacDesktopWallpaperAdapter'

const mockExec = vi.fn()
vi.mock('child_process', () => ({
  exec: (...args: any[]) => {
    mockExec(...args)
    const cb = args[args.length - 1]
    if (typeof cb === 'function') {
      cb(null, '', '')
    }
  }
}))

const mockWriteFileSync = vi.fn()
vi.mock('fs', () => ({
  writeFileSync: (...args: any[]) => mockWriteFileSync(...args),
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userdata')
  },
  screen: {
    getAllDisplays: vi.fn().mockReturnValue([
      { id: 12345, bounds: { width: 1920, height: 1080 } }
    ])
  }
}))

describe('MacDesktopWallpaperAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retrieves screen displays accurately', async () => {
    const adapter = new MacDesktopWallpaperAdapter()
    const screens = await adapter.getScreens()
    expect(screens).toHaveLength(1)
    expect(screens[0]).toEqual({ id: '12345', width: 1920, height: 1080 })
  })

  it('writes wallpaper PNG and executes AppleScript command to set wallpaper', async () => {
    const adapter = new MacDesktopWallpaperAdapter()
    const buffer = Buffer.from('fake-png-data')
    await adapter.set('12345', buffer)

    const expectedPath = join('/mock/userdata', 'wallpaper_cache', 'wallpaper_12345.png')
    expect(mockWriteFileSync).toHaveBeenCalledWith(expectedPath, buffer)
    expect(mockExec).toHaveBeenCalled()
    const execCallString = mockExec.mock.calls[0][0]
    expect(execCallString).toContain('osascript')
    expect(execCallString).toContain('tell application "System Events" to set picture of every desktop')
  })
})
