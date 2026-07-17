import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { IHistoryStore } from '../../ports/IHistoryStore'

export class JsonHistoryStoreAdapter implements IHistoryStore {
  private filePath: string

  constructor() {
    this.filePath = join(app.getPath('userData'), 'murmur.history.json')
  }

  private readAll(): Record<string, string[]> {
    if (!existsSync(this.filePath)) {
      return {}
    }

    try {
      const content = readFileSync(this.filePath, 'utf8')
      return JSON.parse(content) as Record<string, string[]>
    } catch (error) {
      console.warn('JsonHistoryStoreAdapter: Failed to read history file, resetting.', error)
      return {}
    }
  }

  private writeAll(data: Record<string, string[]>): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
      console.error('JsonHistoryStoreAdapter: Failed to write history file', error)
    }
  }

  public async save(monitorId: string, phrase: string): Promise<void> {
    const data = this.readAll()
    const history = data[monitorId] || []
    
    history.unshift(phrase)
    const trimmed = history.slice(0, 10)
    data[monitorId] = trimmed

    this.writeAll(data)
  }

  public async get(monitorId: string): Promise<string[]> {
    const data = this.readAll()
    return data[monitorId] || []
  }

  public async clear(monitorId: string): Promise<void> {
    const data = this.readAll()
    data[monitorId] = []
    this.writeAll(data)
  }
}
