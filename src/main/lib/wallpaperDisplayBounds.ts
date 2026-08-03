import type { Display, Rectangle } from 'electron'

/**
 * BrowserWindow bounds (DIP) for wallpaper overlays.
 * On Windows, expand to the full monitor rect so content covers the translucent taskbar band.
 */
export function wallpaperWindowBounds(display: Display): Rectangle {
  const { bounds, workArea } = display
  if (process.platform !== 'win32') {
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
  }

  const height = Math.max(bounds.height, workArea.y + workArea.height - bounds.y)
  const width = Math.max(bounds.width, workArea.x + workArea.width - bounds.x)
  return {
    x: bounds.x,
    y: bounds.y,
    width,
    height
  }
}

export function logDisplayLayout(display: Display, context: string): void {
  const rect = wallpaperWindowBounds(display)
  console.log(
    `${context} display=${display.id} bounds=${JSON.stringify(display.bounds)} workArea=${JSON.stringify(display.workArea)} wallpaperWindow=${JSON.stringify(rect)} scaleFactor=${display.scaleFactor}`
  )
}
