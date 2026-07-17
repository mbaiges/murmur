import { app, BrowserWindow, Tray, Menu } from 'electron'
import { join } from 'path'

let tray: Tray | null = null
let settingsWindow: BrowserWindow | null = null

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    },
    show: false,
    autoHideMenuBar: true
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

function createTray() {
  // Use a base64 loaded or fallback icon in production.
  // Here we load the bundled placeholder icon.png
  tray = new Tray(join(__dirname, '../../resources/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Refresh Now', click: () => console.log('Refresh triggered') },
    { label: 'Pause Refresh', type: 'checkbox', click: () => console.log('Pause toggled') },
    { type: 'separator' },
    { label: 'Settings', click: createSettingsWindow },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setToolTip('Murmur Wallpaper')
  tray.setContextMenu(contextMenu)
}

app.whenReady().then(() => {
  createTray()
  createSettingsWindow()
})

app.on('window-all-closed', () => {
  // Keep app running in tray when settings is closed
})
