import { registerFont, createCanvas, CanvasRenderingContext2D } from 'canvas'
import { join } from 'path'
import { existsSync } from 'fs'
import { IWallpaperPainter } from '../../ports/IWallpaperPainter'
import { PaintOptions } from '../../domain/types'

export class NodeCanvasWallpaperPainterAdapter implements IWallpaperPainter {
  constructor() {
    // Search packaged paths, production built path, and dev source path
    const pathsToSearch = [
      join(process.resourcesPath || '', 'fonts'),
      join(process.resourcesPath || '', 'resources/fonts'),
      join(__dirname, '../../resources/fonts'),    // Production: out/main/ -> out/ -> root -> resources/fonts
      join(__dirname, '../../../resources/fonts')  // Dev/Test: src/adapters/canvas/ -> src/adapters/ -> src/ -> root -> resources/fonts
    ]
    
    let fontsDir = pathsToSearch[0]
    for (const p of pathsToSearch) {
      if (existsSync(p)) {
        fontsDir = p
        break
      }
    }
    
    const fontFiles = [
      { file: 'EBGaramond-Regular.ttf', family: 'EB Garamond' },
      { file: 'PlayfairDisplay-Regular.ttf', family: 'Playfair Display' },
      { file: 'Outfit-Regular.ttf', family: 'Outfit' }
    ]

    for (const font of fontFiles) {
      const fullPath = join(fontsDir, font.file)
      if (existsSync(fullPath)) {
        try {
          registerFont(fullPath, { family: font.family })
          console.log(`Registered font: ${font.family} from ${fullPath}`)
        } catch (err) {
          console.error(`Failed to register font: ${font.family}`, err)
        }
      } else {
        console.warn(`Font file not found: ${fullPath}. Will fallback to system fonts.`)
      }
    }
  }

  public async paint(options: PaintOptions): Promise<Buffer> {
    const { width, height } = options.resolution
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // 1. Draw Theme Background
    this.drawBackground(ctx, width, height, options.theme)

    // 2. Draw Overlays
    const isDark = ['Midnight', 'Drift', 'Static'].includes(options.theme)
    const textColor = isDark ? '#ffffff' : '#1a1a1a'
    const mutedColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'

    this.drawOverlays(ctx, width, height, options, textColor, mutedColor)

    // 3. Draw Main Poetic Phrase (Wrapped & Centered)
    this.drawPhrase(ctx, width, height, options, textColor)

    return canvas.toBuffer('image/png')
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: string
  ): void {
    if (theme === 'Midnight') {
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, '#0a0b1e')
      grad.addColorStop(1, '#16082c')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        const r = Math.random() * 1.5
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (theme === 'Drift') {
      const grad = ctx.createRadialGradient(
        width * 0.3, height * 0.3, height * 0.1,
        width * 0.5, height * 0.5, height * 0.9
      )
      grad.addColorStop(0, '#1a3c5e')
      grad.addColorStop(0.5, '#0c1b33')
      grad.addColorStop(1, '#050a14')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(100, 150, 255, 0.05)'
      ctx.beginPath()
      ctx.ellipse(width * 0.7, height * 0.4, width * 0.4, height * 0.5, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (theme === 'Parchment') {
      ctx.fillStyle = '#f4f1ea'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.015)'
      for (let i = 0; i < width; i += 4) {
        for (let j = 0; j < height; j += 4) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, 2, 2)
          }
        }
      }
    } else if (theme === 'Blanc') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#fdfdfd')
      grad.addColorStop(1, '#ebebeb')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.fillStyle = '#1e1e1e'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
      for (let i = 0; i < width; i += 3) {
        for (let j = 0; j < height; j += 3) {
          if (Math.random() > 0.6) {
            ctx.fillRect(i, j, 2, 2)
          }
        }
      }
    }
  }

  private drawOverlays(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: PaintOptions,
    textColor: string,
    mutedColor: string
  ): void {
    const padX = width * 0.05
    const padY = height * 0.05

    if (options.overlays.dateTime) {
      ctx.fillStyle = textColor
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.font = '20px "Outfit", sans-serif'
      
      const now = new Date()
      const formatted = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      const timeStr = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      ctx.fillText(`${formatted}  •  ${timeStr}`, width - padX, padY)
    }

    if (options.overlays.inspiringHeadlines && options.headlines && options.headlines.length > 0) {
      ctx.fillStyle = mutedColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.font = 'italic 14px "Outfit", "EB Garamond", serif'
      
      let startY = height - padY
      ctx.fillText('CONCEPTS CONSUMED:', padX, startY - (options.headlines.length * 20) - 10)
      
      options.headlines.forEach((hl, i) => {
        const truncated = hl.length > 60 ? hl.substring(0, 57) + '...' : hl
        ctx.fillText(`• ${truncated}`, padX, startY - ((options.headlines!.length - 1 - i) * 20))
      })
    }

    if (options.overlays.sourceCredit && options.sources && options.sources.length > 0) {
      ctx.fillStyle = mutedColor
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.font = '14px "Outfit", sans-serif'
      
      const sourceStr = `Sources: ${options.sources.join(', ')}`
      ctx.fillText(sourceStr, width - padX, height - padY)
    }
  }

  private drawPhrase(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: PaintOptions,
    textColor: string
  ): void {
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const font = options.fontFamily
    const fontSize = Math.max(32, Math.round(height * 0.05))
    ctx.font = `${fontSize}px "${font}", serif`

    const maxWidth = width * 0.7
    const lines = this.wrapText(ctx, options.phrase, maxWidth)
    
    const lineHeight = fontSize * 1.35
    const totalHeight = lines.length * lineHeight
    let startY = (height / 2) - (totalHeight / 2) + (lineHeight / 2)

    lines.forEach((line) => {
      ctx.fillText(line, width / 2, startY)
      startY += lineHeight
    })
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0] || ''

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const width = ctx.measureText(currentLine + ' ' + word).width
      if (width < maxWidth) {
        currentLine += ' ' + word
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    lines.push(currentLine)
    return lines
  }
}
