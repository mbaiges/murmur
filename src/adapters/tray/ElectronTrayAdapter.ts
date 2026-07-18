import { Tray, Menu, app } from 'electron'
import { join } from 'path'
import { ISystemTray } from '../../ports/ISystemTray'
import { MurmurState } from '../../domain/types'

export class ElectronTrayAdapter implements ISystemTray {
  private tray: Tray | null = null
  private onRefresh: (() => Promise<void>) | null = null
  private onSettings: (() => void) | null = null
  private state: MurmurState = { isPaused: false, lastPhrases: {} }

  public init(onRefresh: () => Promise<void>, onSettings: () => void): void {
    this.onRefresh = onRefresh
    this.onSettings = onSettings

    const iconPath = join(__dirname, '../../resources/tray.png')
    this.tray = new Tray(iconPath)
    this.tray.setToolTip('Murmur Wallpaper')
    this.tray.on('double-click', () => {
      this.onSettings?.()
    })
    this.rebuildMenu()
  }

  public setTooltip(tooltip: string): void {
    this.tray?.setToolTip(tooltip)
  }

  public updateState(state: MurmurState): void {
    this.state = state
    this.rebuildMenu()
  }

  private rebuildMenu(): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Refresh Now',
        click: () => {
          this.onRefresh?.().catch(console.error)
        }
      },
      {
        label: this.state.isPaused ? 'Resume Wallpaper' : 'Pause Wallpaper',
        click: () => {
          console.log('Pause/Resume clicked')
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          this.onSettings?.()
        }
      },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }
}
