import { registerFont, createCanvas, CanvasRenderingContext2D } from 'canvas'
import { join } from 'path'
import { existsSync } from 'fs'
import { IWallpaperPainter } from '../../ports/IWallpaperPainter'
import { PaintOptions } from '../../domain/types'

export class NodeCanvasWallpaperPainterAdapter implements IWallpaperPainter {
  constructor() {
    const pathsToSearch = [
      join(process.resourcesPath || '', 'fonts'),
      join(process.resourcesPath || '', 'resources/fonts'),
      join(__dirname, '../../resources/fonts'),
      join(__dirname, '../../../resources/fonts')
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

  private hexToRgb(hex: string): string {
    const clean = hex.replace('#', '')
    const num = parseInt(clean, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `${r}, ${g}, ${b}`
  }

  private createSeededRandom(seedStr: string) {
    let h = 1779033703 ^ seedStr.length
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
      h = (h << 13) | (h >>> 19)
    }
    let seed = h >>> 0
    return () => {
      seed = (seed + 0x9e3779b9) | 0
      let z = seed
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b)
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35)
      return ((z ^ (z >>> 16)) >>> 0) / 4294967296
    }
  }

  public async paint(options: PaintOptions): Promise<Buffer> {
    const { width, height } = options.resolution
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // 1. Draw Theme Background
    this.drawBackground(ctx, width, height, options.theme)

    // 2. Apply Custom Noise / Grain
    this.applyNoise(ctx, width, height, options.noiseIntensity)

    // 3. Draw Overlays
    const isDark = ['Midnight', 'Drift', 'Static'].includes(options.theme)
    const textColor = isDark ? '#ffffff' : '#1a1a1a'
    const mutedColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'

    this.drawOverlays(ctx, width, height, options, textColor, mutedColor)

    // 4. Apply Vignette Effect
    if (options.vignette) {
      this.applyVignette(ctx, width, height)
    }

    // 5. Draw Main Poetic Phrase (with layouts & animations)
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
    } else if (theme === 'Drift') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#061726')
      grad.addColorStop(1, '#0c2d3a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'Parchment') {
      ctx.fillStyle = '#f4efe2'
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'Blanc') {
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, width, height)
    } else {
      // Static (Noise/TV) Base
      ctx.fillStyle = '#111111'
      ctx.fillRect(0, 0, width, height)
    }
  }

  private applyNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: 'none' | 'subtle' | 'heavy'
  ): void {
    if (intensity === 'none') return

    const opacity = intensity === 'subtle' ? 0.015 : 0.045
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    const step = intensity === 'subtle' ? 3 : 2

    for (let i = 0; i < width; i += step) {
      for (let j = 0; j < height; j += step) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, step - 1, step - 1)
        }
      }
    }
  }

  private applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.25,
      width / 2,
      height / 2,
      width * 0.75
    )
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
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
      ctx.font = 'italic 14px "Outfit", serif'
      
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
    const progress = options.transitionProgress !== undefined ? options.transitionProgress : 1.0
    const textAlpha = progress

    ctx.textBaseline = 'middle'
    const font = options.fontFamily
    const baseFontSize = Math.max(32, Math.round(height * 0.05))

    // Handle scattered letters/words separately
    if (options.layoutStyle === 'scattered') {
      const rand = this.createSeededRandom(options.phrase)
      const words = options.phrase.split(' ')
      
      // Calculate how many words to draw if animating
      const wordsCount = Math.ceil(words.length * progress)
      
      for (let i = 0; i < wordsCount; i++) {
        const word = words[i]
        const x = width * 0.2 + rand() * (width * 0.6)
        const y = height * 0.25 + rand() * (height * 0.5)
        const rotation = (rand() - 0.5) * 0.25
        const scale = 0.8 + rand() * 0.5
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rotation)
        
        const size = Math.round(baseFontSize * scale)
        ctx.font = `${size}px "${font}", serif`
        ctx.textAlign = 'center'
        
        // Morph animation scales up from 0.7
        if (options.animation === 'Morph') {
          const s = 0.7 + 0.3 * progress
          ctx.scale(s, s)
        }

        ctx.fillStyle = `rgba(${this.hexToRgb(textColor)}, ${textAlpha})`
        ctx.fillText(word, 0, 0)
        ctx.restore()
      }
      return
    }

    // Classic wrap text layout
    let alignment: 'center' | 'left' | 'right' = 'center'
    let startX = width / 2
    const maxWidth = width * 0.7

    if (options.layoutStyle === 'editorial-left') {
      alignment = options.textAlignment || 'left'
      startX = width * 0.15
    } else if (options.layoutStyle === 'editorial-right') {
      alignment = options.textAlignment || 'right'
      startX = width * 0.85
    } else {
      alignment = options.textAlignment || 'center'
    }

    ctx.textAlign = alignment
    ctx.font = `${baseFontSize}px "${font}", serif`

    // Extract typewriter progress
    let phraseToPaint = options.phrase
    if (options.animation === 'Typewriter') {
      const words = options.phrase.split(' ')
      phraseToPaint = words.slice(0, Math.ceil(words.length * progress)).join(' ')
    }

    const lines = this.wrapText(ctx, phraseToPaint, maxWidth)
    const lineHeight = baseFontSize * 1.35
    const totalHeight = lines.length * lineHeight
    let startY = (height / 2) - (totalHeight / 2) + (lineHeight / 2)

    // Apply drift offset
    let driftY = 0
    if (options.animation === 'DriftIn') {
      driftY = baseFontSize * (1.0 - progress) * 0.5
    }

    lines.forEach((line) => {
      ctx.save()
      
      // Morph scales the text layout
      if (options.animation === 'Morph') {
        ctx.translate(startX, startY + driftY)
        const s = 0.85 + 0.15 * progress
        ctx.scale(s, s)
        ctx.fillStyle = `rgba(${this.hexToRgb(textColor)}, ${textAlpha})`
        ctx.fillText(line, 0, 0)
      } else {
        ctx.fillStyle = `rgba(${this.hexToRgb(textColor)}, ${textAlpha})`
        ctx.fillText(line, startX, startY + driftY)
      }
      
      ctx.restore()
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
