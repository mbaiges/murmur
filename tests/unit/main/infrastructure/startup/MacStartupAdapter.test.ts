import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MacStartupAdapter } from '../../../../../src/main/infrastructure/startup/MacStartupAdapter'

const mockSetLoginItemSettings = vi.fn()
const mockGetLoginItemSettings = vi.fn()

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/exe'),
    setLoginItemSettings: (...args: any[]) => mockSetLoginItemSettings(...args),
    getLoginItemSettings: (...args: any[]) => mockGetLoginItemSettings(...args)
  }
}))

describe('MacStartupAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enables login item setting correctly', async () => {
    const adapter = new MacStartupAdapter()
    await adapter.enable()
    expect(mockSetLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: true,
      path: '/mock/exe'
    })
  })

  it('disables login item setting correctly', async () => {
    const adapter = new MacStartupAdapter()
    await adapter.disable()
    expect(mockSetLoginItemSettings).toHaveBeenCalledWith({
      openAtLogin: false
    })
  })

  it('queries isEnabled login item state correctly', async () => {
    const adapter = new MacStartupAdapter()
    mockGetLoginItemSettings.mockReturnValue({ openAtLogin: true })
    const enabled = await adapter.isEnabled()
    expect(enabled).toBe(true)
    expect(mockGetLoginItemSettings).toHaveBeenCalled()
  })
})
