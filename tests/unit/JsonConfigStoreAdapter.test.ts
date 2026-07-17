import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { JsonConfigStoreAdapter } from '../../src/adapters/config/JsonConfigStoreAdapter'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue(__dirname)
  }
}))

describe('JsonConfigStoreAdapter', () => {
  const filePath = join(__dirname, 'murmur.config.json')

  beforeEach(() => {
    if (existsSync(filePath)) unlinkSync(filePath)
  })

  afterEach(() => {
    if (existsSync(filePath)) unlinkSync(filePath)
  })

  it('creates default configuration if missing and returns it', async () => {
    const store = new JsonConfigStoreAdapter()
    const config = await store.get()

    expect(existsSync(filePath)).toBe(true)
    expect(config.theme).toBe('Midnight')
    expect(config.refreshIntervalMinutes).toBe(60)
  })

  it('updates configuration and saves correctly', async () => {
    const store = new JsonConfigStoreAdapter()
    await store.set({ theme: 'Parchment', refreshIntervalMinutes: 30 })

    const config = await store.get()
    expect(config.theme).toBe('Parchment')
    expect(config.refreshIntervalMinutes).toBe(30)
  })
})
