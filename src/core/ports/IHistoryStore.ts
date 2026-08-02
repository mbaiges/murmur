export interface IHistoryStore {
  save(monitorId: string, phrase: string): Promise<void>
  get(monitorId: string): Promise<string[]>
  clear(monitorId: string): Promise<void>
}
