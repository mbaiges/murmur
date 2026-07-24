import { registerFont, createCanvas, CanvasRenderingContext2D } from 'canvas'
import { join } from 'path'
import { existsSync } from 'fs'
import { IWallpaperPainter } from '../../ports/IWallpaperPainter'
import { PaintOptions } from '../../domain/types'

interface CanvasStyledChar {
  char: string
  isBold: boolean
  isItalic: boolean
  fontFamily: string
}

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
    const isDark = ['Midnight', 'Drift', 'Static', 'Forest', 'Crimson', 'Cyberpunk', 'WarmGlow'].includes(options.theme)
    const textColor = isDark ? '#ffffff' : '#1a1a1a'
    const mutedColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'

    this.drawOverlays(ctx, width, height, options, textColor, mutedColor)

    // 4. Apply Vignette Effect
    if (options.vignetteStyle && options.vignetteStyle !== 'none') {
      this.applyVignette(ctx, width, height, options.vignetteStyle)
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
    } else if (theme === 'Forest') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#051d14')
      grad.addColorStop(1, '#02120b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'Crimson') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#1c050a')
      grad.addColorStop(1, '#0d0104')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'Cyberpunk') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#0b0214')
      grad.addColorStop(1, '#031416')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'WarmGlow') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, '#241407')
      grad.addColorStop(1, '#100801')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'Parchment') {
      ctx.fillStyle = '#f4efe2'
      ctx.fillRect(0, 0, width, height)
    } else if (theme === 'Blanc') {
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, width, height)
    } else {
      // Static Base
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

  private applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number, style: 'soft' | 'medium' | 'dramatic'): void {
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.25,
      width / 2,
      height / 2,
      width * 0.75
    )
    
    let alpha = 0.35
    if (style === 'soft') alpha = 0.2
    else if (style === 'dramatic') alpha = 0.65

    grad.addColorStop(0, 'rgba(0, 0, 0, 0)')
    grad.addColorStop(1, `rgba(0, 0, 0, ${alpha})`)
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

  private compileToStyledChars(
    text: string,
    defaultFontFamily: string,
    isBold = false,
    isItalic = false,
    currentFontFamily = ''
  ): CanvasStyledChar[] {
    if (!text) return []

    const result: CanvasStyledChar[] = []
    let currentText = text

    while (currentText.length > 0) {
      const boldIdx = currentText.indexOf('**')
      const italicIdx = currentText.indexOf('*')
      const fontStartIdx = currentText.indexOf('[font:')

      const indices = [
        { type: 'font', index: fontStartIdx },
        { type: 'bold', index: boldIdx },
        { type: 'italic', index: italicIdx }
      ].filter((item) => item.index !== -1)

      if (indices.length === 0) {
        for (const char of currentText) {
          result.push({
            char,
            isBold,
            isItalic,
            fontFamily: currentFontFamily || defaultFontFamily
          })
        }
        break
      }

      indices.sort((a, b) => {
        if (a.index !== b.index) {
          return a.index - b.index
        }
        const priority: Record<string, number> = { font: 0, bold: 1, italic: 2 }
        return priority[a.type] - priority[b.type]
      })

      const nextMatch = indices[0]

      if (nextMatch.index > 0) {
        const plain = currentText.substring(0, nextMatch.index)
        for (const char of plain) {
          result.push({
            char,
            isBold,
            isItalic,
            fontFamily: currentFontFamily || defaultFontFamily
          })
        }
        currentText = currentText.substring(nextMatch.index)
      }

      if (nextMatch.type === 'bold') {
        const closeIdx = currentText.indexOf('**', 2)
        if (closeIdx !== -1) {
          const inner = currentText.substring(2, closeIdx)
          result.push(
            ...this.compileToStyledChars(
              inner,
              defaultFontFamily,
              true,
              isItalic,
              currentFontFamily
            )
          )
          currentText = currentText.substring(closeIdx + 2)
        } else {
          result.push({ char: '*', isBold, isItalic, fontFamily: currentFontFamily || defaultFontFamily })
          result.push({ char: '*', isBold, isItalic, fontFamily: currentFontFamily || defaultFontFamily })
          currentText = currentText.substring(2)
        }
      } else if (nextMatch.type === 'italic') {
        const closeIdx = currentText.indexOf('*', 1)
        if (closeIdx !== -1) {
          const inner = currentText.substring(1, closeIdx)
          result.push(
            ...this.compileToStyledChars(
              inner,
              defaultFontFamily,
              isBold,
              true,
              currentFontFamily
            )
          )
          currentText = currentText.substring(closeIdx + 1)
        } else {
          result.push({ char: '*', isBold, isItalic, fontFamily: currentFontFamily || defaultFontFamily })
          currentText = currentText.substring(1)
        }
      } else if (nextMatch.type === 'font') {
        const closeIdx = currentText.indexOf(']', 6)
        if (closeIdx !== -1) {
          const fontName = currentText.substring(6, closeIdx)
          const tagClose = `[/font]`
          const tagCloseIdx = currentText.indexOf(tagClose, closeIdx + 1)
          if (tagCloseIdx !== -1) {
            const inner = currentText.substring(closeIdx + 1, tagCloseIdx)
            result.push(
              ...this.compileToStyledChars(
                inner,
                defaultFontFamily,
                isBold,
                isItalic,
                fontName
              )
            )
            currentText = currentText.substring(tagCloseIdx + tagClose.length)
          } else {
            for (let i = 0; i <= closeIdx; i++) {
              result.push({ char: currentText[i], isBold, isItalic, fontFamily: currentFontFamily || defaultFontFamily })
            }
            currentText = currentText.substring(closeIdx + 1)
          }
        } else {
          result.push({ char: '[', isBold, isItalic, fontFamily: currentFontFamily || defaultFontFamily })
          currentText = currentText.substring(1)
        }
      }
    }

    return result
  }

  private wrapStyledChars(
    ctx: CanvasRenderingContext2D,
    chars: CanvasStyledChar[],
    maxWidth: number,
    baseFontSize: number
  ): CanvasStyledChar[][] {
    const words: CanvasStyledChar[][] = []
    let currentWord: CanvasStyledChar[] = []

    for (const char of chars) {
      if (char.char === ' ') {
        if (currentWord.length > 0) {
          words.push(currentWord)
          currentWord = []
        }
        words.push([char])
      } else {
        currentWord.push(char)
      }
    }
    if (currentWord.length > 0) {
      words.push(currentWord)
    }

    const lines: CanvasStyledChar[][] = []
    let currentLine: CanvasStyledChar[] = []

    for (const word of words) {
      const testLine = [...currentLine, ...word]
      const lineWidth = this.measureStyledChars(ctx, testLine, baseFontSize)
      
      if (lineWidth < maxWidth || currentLine.length === 0) {
        currentLine = testLine
      } else {
        if (currentLine.length > 0 && currentLine[currentLine.length - 1].char === ' ') {
          currentLine.pop()
        }
        lines.push(currentLine)
        
        if (word.length === 1 && word[0].char === ' ') {
          currentLine = []
        } else {
          currentLine = word
        }
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    return lines
  }

  private getCanvasFont(run: { isBold: boolean; isItalic: boolean; fontFamily: string }, baseFontSize: number): string {
    const customFonts = ['EB Garamond', 'Playfair Display', 'Outfit']
    const isCustom = customFonts.includes(run.fontFamily)
    
    let styleStr = ''
    if (!isCustom) {
      if (run.isBold) styleStr += 'bold '
      if (run.isItalic) styleStr += 'italic '
    }
    
    return `${styleStr}${baseFontSize}px "${run.fontFamily}"`
  }

  private measureStyledChars(
    ctx: CanvasRenderingContext2D,
    chars: CanvasStyledChar[],
    baseFontSize: number
  ): number {
    let width = 0
    const runs = this.groupToRuns(chars)
    for (const run of runs) {
      ctx.save()
      ctx.font = this.getCanvasFont(run, baseFontSize)
      width += ctx.measureText(run.text).width
      ctx.restore()
    }
    return width
  }

  private groupToRuns(chars: CanvasStyledChar[]): { text: string; isBold: boolean; isItalic: boolean; fontFamily: string }[] {
    const runs: { text: string; isBold: boolean; isItalic: boolean; fontFamily: string }[] = []
    if (chars.length === 0) return runs

    let currentRun = {
      text: chars[0].char,
      isBold: chars[0].isBold,
      isItalic: chars[0].isItalic,
      fontFamily: chars[0].fontFamily
    }

    for (let i = 1; i < chars.length; i++) {
      const char = chars[i]
      if (
        char.isBold === currentRun.isBold &&
        char.isItalic === currentRun.isItalic &&
        char.fontFamily === currentRun.fontFamily
      ) {
        currentRun.text += char.char
      } else {
        runs.push(currentRun)
        currentRun = {
          text: char.char,
          isBold: char.isBold,
          isItalic: char.isItalic,
          fontFamily: char.fontFamily
        }
      }
    }
    runs.push(currentRun)
    return runs
  }

  private drawStyledLine(
    ctx: CanvasRenderingContext2D,
    line: CanvasStyledChar[],
    startX: number,
    y: number,
    alignment: 'center' | 'left' | 'right',
    baseFontSize: number,
    textColor: string,
    textAlpha: number
  ): void {
    const totalWidth = this.measureStyledChars(ctx, line, baseFontSize)
    
    let currentX = startX
    if (alignment === 'center') {
      currentX = startX - (totalWidth / 2)
    } else if (alignment === 'right') {
      currentX = startX - totalWidth
    }

    const runs = this.groupToRuns(line)
    for (const run of runs) {
      ctx.save()
      ctx.font = this.getCanvasFont(run, baseFontSize)
      ctx.textAlign = 'left'
      ctx.fillStyle = `rgba(${this.hexToRgb(textColor)}, ${textAlpha})`
      ctx.fillText(run.text, currentX, y)
      
      const customFonts = ['EB Garamond', 'Playfair Display', 'Outfit']
      const isCustom = customFonts.includes(run.fontFamily)
      if (run.isBold && isCustom) {
        ctx.fillText(run.text, currentX + 1, y)
      }
      
      currentX += ctx.measureText(run.text).width
      ctx.restore()
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
    
    // Scale font size based on phrase length to avoid overflows
    const phraseLength = options.phrase.length
    let scale = 1.0
    if (phraseLength > 220) {
      scale = 0.55
    } else if (phraseLength > 130) {
      scale = 0.70
    } else if (phraseLength > 75) {
      scale = 0.85
    }

    const baseFontSize = Math.max(20, Math.round(height * 0.05 * scale))

    // Handle scattered layout separately
    if (options.layoutStyle === 'scattered') {
      const rand = this.createSeededRandom(options.phrase)
      const compiledChars = this.compileToStyledChars(options.phrase, font)
      
      // Split compiled characters by space into word arrays
      const words: CanvasStyledChar[][] = []
      let currentWord: CanvasStyledChar[] = []
      for (const char of compiledChars) {
        if (char.char === ' ') {
          if (currentWord.length > 0) {
            words.push(currentWord)
            currentWord = []
          }
        } else {
          currentWord.push(char)
        }
      }
      if (currentWord.length > 0) {
        words.push(currentWord)
      }

      const wordsCount = Math.ceil(words.length * progress)
      
      for (let i = 0; i < wordsCount; i++) {
        const wordChars = words[i]
        const x = width * 0.2 + rand() * (width * 0.6)
        const y = height * 0.25 + rand() * (height * 0.5)
        const rotation = (rand() - 0.5) * 0.25
        const sizeScale = 0.8 + rand() * 0.5
        
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rotation)
        
        const size = Math.round(baseFontSize * sizeScale)
        
        if (options.animation === 'Morph') {
          const s = 0.7 + 0.3 * progress
          ctx.scale(s, s)
        }

        this.drawStyledLine(ctx, wordChars, 0, 0, 'center', size, textColor, textAlpha)
        ctx.restore()
      }
      return
    }

    // Wrap and layout standard text
    const maxWidth = width * 0.7
    const rawLines = options.phrase.split('\\n')
    const phraseLines = rawLines.map(line => this.compileToStyledChars(line, font))
    
    // Perform wrapping on each pre-split line
    const wrappedLines: CanvasStyledChar[][] = []
    phraseLines.forEach(line => {
      wrappedLines.push(...this.wrapStyledChars(ctx, line, maxWidth, baseFontSize))
    })

    const lineHeight = baseFontSize * 1.35
    const totalHeight = wrappedLines.length * lineHeight
    let startY = (height / 2) - (totalHeight / 2) + (lineHeight / 2)

    let driftY = 0
    if (options.animation === 'DriftIn') {
      driftY = baseFontSize * (1.0 - progress) * 0.5
    }

    // Render asymmetrical alternating paragraphs
    if (options.layoutStyle === 'asymmetrical') {
      const chunkCount = Math.min(3, wrappedLines.length)
      const chunkSize = Math.ceil(wrappedLines.length / chunkCount)
      
      wrappedLines.forEach((line, idx) => {
        const chunkIndex = Math.floor(idx / chunkSize)
        let lineAlign: 'left' | 'center' | 'right' = 'center'
        let lineX = width / 2
        
        if (chunkIndex === 0) {
          lineAlign = 'left'
          lineX = width * 0.15
        } else if (chunkIndex === 2) {
          lineAlign = 'right'
          lineX = width * 0.85
        }
        
        this.drawStyledLine(ctx, line, lineX, startY + driftY, lineAlign, baseFontSize, textColor, textAlpha)
        startY += lineHeight
      })
      return
    }

    // Render book cover template with line separator & custom subtext
    if (options.layoutStyle === 'book-cover') {
      wrappedLines.forEach((line) => {
        this.drawStyledLine(ctx, line, width / 2, startY + driftY, 'center', baseFontSize, textColor, textAlpha)
        startY += lineHeight
      })

      const lineY = startY + 20
      ctx.save()
      ctx.strokeStyle = textColor
      ctx.globalAlpha = 0.2 * textAlpha
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(width / 2 - 50, lineY)
      ctx.lineTo(width / 2 + 50, lineY)
      ctx.stroke()
      ctx.restore()

      if (options.overlays.dateTime) {
        ctx.save()
        ctx.fillStyle = textColor
        ctx.globalAlpha = 0.5 * textAlpha
        ctx.textAlign = 'center'
        ctx.font = '12px "Outfit", sans-serif'
        ctx.fillText(`Murmur Conceptual Poetry`, width / 2, lineY + 45)
        ctx.restore()
      }
      return
    }

    // Render classic, editorial-left, or editorial-right layouts
    let alignment: 'center' | 'left' | 'right' = 'center'
    let startX = width / 2

    if (options.layoutStyle === 'editorial-left') {
      alignment = options.textAlignment || 'left'
      startX = width * 0.15
    } else if (options.layoutStyle === 'editorial-right') {
      alignment = options.textAlignment || 'right'
      startX = width * 0.85
    } else {
      alignment = options.textAlignment || 'center'
    }

    wrappedLines.forEach((line) => {
      ctx.save()
      if (options.animation === 'Morph') {
        ctx.translate(startX, startY + driftY)
        const s = 0.85 + 0.15 * progress
        ctx.scale(s, s)
        this.drawStyledLine(ctx, line, 0, 0, alignment, baseFontSize, textColor, textAlpha)
      } else {
        this.drawStyledLine(ctx, line, startX, startY + driftY, alignment, baseFontSize, textColor, textAlpha)
      }
      ctx.restore()
      startY += lineHeight
    })
  }
}
