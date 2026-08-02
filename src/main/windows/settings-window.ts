import { BrowserWindow } from 'electron'
import { join } from 'path'
import { resolveBrandIconPath } from '../lib/resolveBrandIcon'

let settingsWindow: BrowserWindow | null = null

export function getSettingsWindow(): BrowserWindow | null {
  if (settingsWindow?.isDestroyed()) {
    settingsWindow = null
  }
  return settingsWindow
}

export function showSettingsWindow(): void {
  const win = getSettingsWindow()
  if (win) {
    if (win.isMinimized()) {
      win.restore()
    }
    win.show()
    win.focus()
    return
  }

  createSettingsWindow()
}

export function createSettingsWindow(): void {
  if (getSettingsWindow()) {
    showSettingsWindow()
    return
  }

  let iconPath: string | undefined
  try {
    iconPath = resolveBrandIconPath()
  } catch {
    iconPath = undefined
  }

  settingsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    autoHideMenuBar: true,
    show: true,
    resizable: true,
    title: 'Murmur Settings',
    icon: iconPath,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#090d16',
      symbolColor: '#94a3b8',
      height: 40
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    settingsWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}
