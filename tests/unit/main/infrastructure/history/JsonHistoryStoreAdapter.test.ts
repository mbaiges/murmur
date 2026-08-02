import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { JsonHistoryStoreAdapter } from '../../../../../src/main/infrastructure/history/JsonHistoryStoreAdapter'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue(__dirname)
  }
}))

describe('JsonHistoryStoreAdapter', () => {
  const filePath = join(__dirname, 'murmur.history.json')

  beforeEach(() => {
    if (existsSync(filePath)) unlinkSync(filePath)
  })

  afterEach(() => {
    if (existsSync(filePath)) unlinkSync(filePath)
  })

  it('saves phrases and limits history length to 10 per monitor', async () => {
    const store = new JsonHistoryStoreAdapter()

    for (let i = 1; i <= 12; i++) {
      await store.save('monitor-1', `Phrase ${i}`)
    }

    const history = await store.get('monitor-1')
    expect(history.length).toBe(10)
    expect(history[0]).toBe('Phrase 12')
    expect(history[9]).toBe('Phrase 3')
  })

  it('clears history correctly', async () => {
    const store = new JsonHistoryStoreAdapter()
    await store.save('monitor-1', 'Some phrase')
    
    let history = await store.get('monitor-1')
    expect(history.length).toBe(1)

    await store.clear('monitor-1')
    history = await store.get('monitor-1')
    expect(history.length).toBe(0)
  })
})
