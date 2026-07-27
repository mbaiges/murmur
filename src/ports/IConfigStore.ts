import { MurmurConfig } from '../domain/types'
export interface IConfigStore {
  get(): Promise<MurmurConfig>
  set(config: Partial<MurmurConfig>): Promise<void>
}
