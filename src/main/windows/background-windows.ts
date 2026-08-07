import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import type { IWallpaperRenderer } from '../../core/ports/IWallpaperRenderer'
import { logDisplayLayout, wallpaperWindowBounds } from '../lib/wallpaperDisplayBounds'

const bgWindows = new Map<string, BrowserWindow>()

export function getBackgroundWindows(): ReadonlyMap<string, BrowserWindow> {
  return bgWindows
}

export function hasBackgroundWindow(monitorId: string): boolean {
  const win = bgWindows.get(monitorId)
  return !!win && !win.isDestroyed()
}

export function forEachBackgroundWindow(fn: (win: BrowserWindow) => void): void {
  bgWindows.forEach((win) => {
    if (!win.isDestroyed()) {
      fn(win)
    }
  })
}

export function destroyAllBackgroundWindows(): void {
  bgWindows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.destroy()
    }
  })
  bgWindows.clear()
}

export function createBackgroundWindow(
  screenInfo: { id: string; width: number; height: number },
  x: number,
  y: number,
  wallpaperRenderer: IWallpaperRenderer,
  isQuitting: () => boolean
): void {
  const display = screen.getAllDisplays().find((d) => String(d.id) === screenInfo.id)
  const rect = display
    ? wallpaperWindowBounds(display)
    : { x, y, width: screenInfo.width, height: screenInfo.height }
  if (display) {
    logDisplayLayout(display, 'createBackgroundWindow')
  }

  const windowTitle = `Murmur Background - ${screenInfo.id}`
  const bgWindow = new BrowserWindow({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    frame: false,
    transparent: true,
    type: process.platform === 'darwin' ? 'desktop' : undefined,
    enableLargerThanScreen: true,
    skipTaskbar: true,
    title: windowTitle,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false
    }
  })

  bgWindow.on('close', (e) => {
    if (!isQuitting()) {
      e.preventDefault()
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    bgWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}?view=wallpaper&monitorId=${screenInfo.id}`)
  } else {
    bgWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { view: 'wallpaper', monitorId: screenInfo.id }
    })
  }

  bgWindow.once('ready-to-show', async () => {
    bgWindow.show()
    bgWindow.setIgnoreMouseEvents(true)
    bgWindow.webContents.setBackgroundThrottling(false)

    try {
      if (
        process.platform === 'win32' &&
        typeof (wallpaperRenderer as { inject?: (h: string) => Promise<void> }).inject === 'function'
      ) {
        const hwndBuffer = bgWindow.getNativeWindowHandle()
        const hwndVal =
          process.arch === 'x64'
            ? hwndBuffer.readBigInt64LE(0).toString()
            : hwndBuffer.readInt32LE(0).toString()

        console.log(
          `Injecting live window for display ${screenInfo.id} (HWND: ${hwndVal}) into WorkerW container...`
        )
        await (wallpaperRenderer as { inject: (h: string) => Promise<void> }).inject(hwndVal)
        if (display) {
          bgWindow.setBounds(wallpaperWindowBounds(display))
        }
        bgWindow.setSkipTaskbar(true)
        const styleChild = (wallpaperRenderer as { styleChild?: (h: string) => Promise<void> }).styleChild
        if (styleChild) {
          await styleChild(hwndVal)
        }
      }
    } catch (err) {
      console.error(`Failed to inject window for display ${screenInfo.id} into desktop`, err)
    }
  })

  bgWindows.set(screenInfo.id, bgWindow)
}
