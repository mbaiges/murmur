import type { Tray } from 'electron'
import type { IUpdateReadyNotifier } from '@core/ports/IUpdateReadyNotifier'
import { MacUpdateReadyNotifierAdapter } from './MacUpdateReadyNotifierAdapter'
import { WinUpdateReadyNotifierAdapter } from './WinUpdateReadyNotifierAdapter'
import { NoOpUpdateReadyNotifier } from './NoOpUpdateReadyNotifier'

export function createUpdateReadyNotifier(options: {
  enabled: boolean
  getTray: () => Tray | null
}): IUpdateReadyNotifier {
  if (!options.enabled) {
    return new NoOpUpdateReadyNotifier()
  }
  if (process.platform === 'win32') {
    return new WinUpdateReadyNotifierAdapter(options.getTray)
  }
  if (process.platform === 'darwin') {
    return new MacUpdateReadyNotifierAdapter()
  }
  return new NoOpUpdateReadyNotifier()
}
