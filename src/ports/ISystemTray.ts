import { MurmurState } from '../domain/types'
export interface ISystemTray {
  init(onRefresh: () => Promise<void>, onSettings: () => void): void
  setTooltip(tooltip: string): void
  updateState(state: MurmurState): void
}
