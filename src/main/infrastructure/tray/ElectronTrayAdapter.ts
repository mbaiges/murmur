import { Tray, Menu, app, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { resolveBrandIconPath } from '../../lib/resolveBrandIcon'
import { ISystemTray } from '../../../core/ports/ISystemTray'
import { MurmurState } from '../../../core/domain/types'

function resolveTrayIconPath(): string {
  const brandPath = resolveBrandIconPath()
  if (process.platform === 'darwin') {
    const trayPath = join(dirname(brandPath), 'logo-tray.png')
    if (existsSync(trayPath)) {
      return trayPath
    }
  }
  return brandPath
}

function createTrayImage() {
  const iconPath = resolveTrayIconPath()
  let image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) {
    throw new Error(`Tray icon could not be loaded from ${iconPath}`)
  }
  if (process.platform === 'darwin') {
    image = image.resize({ width: 22, height: 22 })
    image.setTemplateImage(true)
  }
  return image
}

export class ElectronTrayAdapter implements ISystemTray {
  private tray: Tray | null = null
  private onRefresh: (() => Promise<void>) | null = null
  private onSettings: (() => void) | null = null
  private onQuit: (() => void) | null = null
  private state: MurmurState = { isPaused: false, lastPhrases: {}, lastContent: {} }

  public init(
    onRefresh: () => Promise<void>,
    onSettings: () => void,
    onQuit?: () => void
  ): void {
    this.onRefresh = onRefresh
    this.onSettings = onSettings
    this.onQuit = onQuit ?? null

    this.tray = new Tray(createTrayImage())
    this.tray.setToolTip('Murmur')
    this.tray.on('double-click', () => {
      this.onSettings?.()
    })
    if (process.platform === 'darwin') {
      this.tray.on('click', () => {
        this.onSettings?.()
      })
    }
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
          if (this.onQuit) {
            this.onQuit()
          } else {
            app.quit()
          }
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }
}
