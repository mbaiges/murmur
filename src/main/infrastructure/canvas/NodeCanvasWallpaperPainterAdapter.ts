import { registerFont, createCanvas, CanvasRenderingContext2D } from 'canvas'
import { join } from 'path'
import { existsSync } from 'fs'
import { IWallpaperPainter } from '../../../core/ports/IWallpaperPainter'
import { PaintOptions } from '../../../core/domain/types'
import { PhraseFormatFlags, splitPhraseLines } from '../../../core/lib/phrase/phraseFormatFlags'
import { splitFlatCharsAtWordMidpoint, splitPlainPhraseHeadlineDeck } from '../../../core/lib/phrase/phraseLayoutSplit'
import { phraseToPlainText } from '../../../core/lib/phrase/phrasePlainText'

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
    flags: PhraseFormatFlags,
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
              flags,
              flags.enableBold ? true : isBold,
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
              flags,
              isBold,
              flags.enableItalic ? true : isItalic,
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
                flags,
                isBold,
                isItalic,
                flags.enableDifferentFonts ? fontName : currentFontFamily
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
    const formatFlags: PhraseFormatFlags = {
      enableBold: options.enableBold,
      enableItalic: options.enableItalic,
      enableNewlines: options.enableNewlines,
      enableDifferentFonts: options.enableDifferentFonts
    }
    
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
      const compiledChars = this.compileToStyledChars(options.phrase, font, formatFlags)
      
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
    const rawLines = splitPhraseLines(options.phrase, options.enableNewlines)
    const phraseLines = rawLines.map((line) => this.compileToStyledChars(line, font, formatFlags))
    
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

    // Magazine split spread: headline halves on left and right pages
    if (options.layoutStyle === 'split-spread') {
      const content = options.layoutContent
      if (
        content?.layoutStyle === 'split-spread' &&
        content.payload.left &&
        content.payload.right
      ) {
        const left = this.compileToStyledChars(content.payload.left, font, formatFlags)
        const right = this.compileToStyledChars(content.payload.right, font, formatFlags)
        const leftLines = this.wrapStyledChars(ctx, left, width * 0.38, baseFontSize * 1.05)
        const rightLines = this.wrapStyledChars(ctx, right, width * 0.38, baseFontSize * 1.05)
        const leftX = width * 0.12
        const rightX = width * 0.88
        let yLeft = height / 2 - ((leftLines.length * lineHeight) / 2) + lineHeight / 2
        let yRight = height / 2 - ((rightLines.length * lineHeight) / 2) + lineHeight / 2
        leftLines.forEach((line) => {
          this.drawStyledLine(ctx, line, leftX, yLeft + driftY, 'left', baseFontSize * 1.05, textColor, textAlpha)
          yLeft += lineHeight
        })
        rightLines.forEach((line) => {
          this.drawStyledLine(ctx, line, rightX, yRight + driftY, 'right', baseFontSize * 1.05, textColor, textAlpha)
          yRight += lineHeight
        })
        return
      }

      const flatChars = phraseLines.flat()
      const { left, right } = splitFlatCharsAtWordMidpoint(flatChars)
      const leftLines = this.wrapStyledChars(ctx, left, width * 0.38, baseFontSize * 1.05)
      const rightLines = this.wrapStyledChars(ctx, right, width * 0.38, baseFontSize * 1.05)
      const leftX = width * 0.12
      const rightX = width * 0.88
      let yLeft =
        height / 2 - ((leftLines.length * lineHeight) / 2) + lineHeight / 2
      let yRight =
        height / 2 - ((rightLines.length * lineHeight) / 2) + lineHeight / 2
      leftLines.forEach((line) => {
        this.drawStyledLine(ctx, line, leftX, yLeft + driftY, 'left', baseFontSize * 1.05, textColor, textAlpha)
        yLeft += lineHeight
      })
      rightLines.forEach((line) => {
        this.drawStyledLine(ctx, line, rightX, yRight + driftY, 'right', baseFontSize * 1.05, textColor, textAlpha)
        yRight += lineHeight
      })
      return
    }

    // Tabloid: display headline + smaller deck (standfirst)
    if (options.layoutStyle === 'tabloid-stack') {
      const content = options.layoutContent
      if (content?.layoutStyle === 'tabloid-stack' && content.payload.headline) {
        const headlineChars = this.compileToStyledChars(content.payload.headline, font, formatFlags)
        const deckChars = content.payload.deck
          ? this.compileToStyledChars(content.payload.deck, font, formatFlags)
          : []
        const headlineSize = Math.round(baseFontSize * 1.35)
        const deckSize = Math.round(baseFontSize * 0.72)
        const headlineLines = this.wrapStyledChars(ctx, headlineChars, width * 0.75, headlineSize)
        const deckLines = deckChars.length
          ? this.wrapStyledChars(ctx, deckChars, width * 0.55, deckSize)
          : []
        const blockHeight =
          headlineLines.length * lineHeight * 1.1 + (deckLines.length ? deckLines.length * lineHeight * 0.95 + 28 : 0)
        let y = height / 2 - blockHeight / 2 + lineHeight / 2
        headlineLines.forEach((line) => {
          this.drawStyledLine(ctx, line, width / 2, y + driftY, 'center', headlineSize, textColor, textAlpha)
          y += lineHeight * 1.1
        })
        if (deckLines.length) {
          y += 12
          deckLines.forEach((line) => {
            ctx.save()
            ctx.globalAlpha = textAlpha * 0.55
            this.drawStyledLine(ctx, line, width / 2, y + driftY, 'center', deckSize, textColor, textAlpha)
            ctx.restore()
            y += lineHeight * 0.95
          })
        }
        return
      }

      const plain = phraseToPlainText(options.phrase)
      const { headline, deck } = splitPlainPhraseHeadlineDeck(plain)
      const headlineChars = this.compileToStyledChars(headline, font, formatFlags)
      const deckChars = deck ? this.compileToStyledChars(deck, font, formatFlags) : []
      const headlineSize = Math.round(baseFontSize * 1.35)
      const deckSize = Math.round(baseFontSize * 0.72)
      const headlineLines = this.wrapStyledChars(ctx, headlineChars, width * 0.75, headlineSize)
      const deckLines = deckChars.length
        ? this.wrapStyledChars(ctx, deckChars, width * 0.55, deckSize)
        : []
      const blockHeight =
        headlineLines.length * lineHeight * 1.1 + (deckLines.length ? deckLines.length * lineHeight * 0.95 + 28 : 0)
      let y = height / 2 - blockHeight / 2 + lineHeight / 2
      headlineLines.forEach((line) => {
        this.drawStyledLine(ctx, line, width / 2, y + driftY, 'center', headlineSize, textColor, textAlpha)
        y += lineHeight * 1.1
      })
      if (deckLines.length) {
        y += 12
        deckLines.forEach((line) => {
          ctx.save()
          ctx.globalAlpha = textAlpha * 0.55
          this.drawStyledLine(ctx, line, width / 2, y + driftY, 'center', deckSize, textColor, textAlpha)
          ctx.restore()
          y += lineHeight * 0.95
        })
      }
      return
    }

    // Feature opener: section label + hero headline + deck
    if (options.layoutStyle === 'feature-opener') {
      const content = options.layoutContent
      if (content?.layoutStyle === 'feature-opener' && content.payload.headline) {
        const headlineChars = this.compileToStyledChars(content.payload.headline, font, formatFlags)
        const deckChars = content.payload.deck
          ? this.compileToStyledChars(content.payload.deck, font, formatFlags)
          : []
        const headlineSize = Math.round(baseFontSize * 1.55)
        const deckSize = Math.round(baseFontSize * 0.78)
        const headlineLines = this.wrapStyledChars(ctx, headlineChars, width * 0.72, headlineSize)
        const deckLines = deckChars.length
          ? this.wrapStyledChars(ctx, deckChars, width * 0.55, deckSize)
          : []
        let blockH =
          headlineLines.length * lineHeight * 1.05 +
          (content.payload.section ? 28 : 0) +
          (deckLines.length ? deckLines.length * lineHeight * 0.95 + 20 : 0)
        let y = height / 2 - blockH / 2 + lineHeight / 2
        const leftX = width * 0.14
        if (content.payload.section) {
          ctx.save()
          ctx.globalAlpha = textAlpha * 0.5
          ctx.font = `${Math.round(baseFontSize * 0.45)}px sans-serif`
          ctx.fillStyle = textColor
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(content.payload.section.toUpperCase(), leftX, y)
          ctx.restore()
          y += 14
          ctx.save()
          ctx.strokeStyle = textColor
          ctx.globalAlpha = 0.25 * textAlpha
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(leftX, y)
          ctx.lineTo(leftX + 56, y)
          ctx.stroke()
          ctx.restore()
          y += 18
        }
        headlineLines.forEach((line) => {
          this.drawStyledLine(ctx, line, leftX, y + driftY, 'left', headlineSize, textColor, textAlpha)
          y += lineHeight * 1.05
        })
        if (deckLines.length) {
          y += 10
          deckLines.forEach((line) => {
            ctx.save()
            ctx.globalAlpha = textAlpha * 0.55
            this.drawStyledLine(ctx, line, leftX, y + driftY, 'left', deckSize, textColor, textAlpha)
            ctx.restore()
            y += lineHeight * 0.95
          })
        }
        return
      }
    }

    // Sidebar rail: wide main + narrow margin column
    if (options.layoutStyle === 'sidebar-rail') {
      const content = options.layoutContent
      if (content?.layoutStyle === 'sidebar-rail' && content.payload.main && content.payload.sidebar) {
        const mainChars = this.compileToStyledChars(content.payload.main, font, formatFlags)
        const sidebarChars = this.compileToStyledChars(content.payload.sidebar, font, formatFlags)
        const mainSize = Math.round(baseFontSize * 1.12)
        const sidebarSize = Math.round(baseFontSize * 0.68)
        const mainLines = this.wrapStyledChars(ctx, mainChars, width * 0.42, mainSize)
        const sidebarLines = this.wrapStyledChars(ctx, sidebarChars, width * 0.22, sidebarSize)
        const mainX = width * 0.12
        const sidebarX = width * 0.68
        const maxLines = Math.max(mainLines.length, sidebarLines.length)
        const blockH = maxLines * lineHeight
        let y = height / 2 - blockH / 2 + lineHeight / 2
        ctx.save()
        ctx.strokeStyle = textColor
        ctx.globalAlpha = 0.25 * textAlpha
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(sidebarX - 16, y - lineHeight * 0.3)
        ctx.lineTo(sidebarX - 16, y + blockH)
        ctx.stroke()
        ctx.restore()
        for (let i = 0; i < maxLines; i++) {
          if (mainLines[i]) {
            this.drawStyledLine(ctx, mainLines[i], mainX, y + driftY, 'left', mainSize, textColor, textAlpha)
          }
          if (sidebarLines[i]) {
            ctx.save()
            ctx.globalAlpha = textAlpha * 0.6
            this.drawStyledLine(ctx, sidebarLines[i], sidebarX, y + driftY, 'left', sidebarSize, textColor, textAlpha)
            ctx.restore()
          }
          y += lineHeight
        }
        return
      }
    }

    // Byline + lede: headline, credit, opening paragraph
    if (options.layoutStyle === 'byline-lede') {
      const content = options.layoutContent
      if (content?.layoutStyle === 'byline-lede' && content.payload.headline && content.payload.lede) {
        const headlineChars = this.compileToStyledChars(content.payload.headline, font, formatFlags)
        const ledeChars = this.compileToStyledChars(content.payload.lede, font, formatFlags)
        const headlineSize = Math.round(baseFontSize * 1.22)
        const ledeSize = Math.round(baseFontSize * 0.82)
        const headlineLines = this.wrapStyledChars(ctx, headlineChars, width * 0.55, headlineSize)
        const ledeLines = this.wrapStyledChars(ctx, ledeChars, width * 0.52, ledeSize)
        let blockH =
          headlineLines.length * lineHeight * 1.05 +
          (content.payload.byline ? 22 : 0) +
          ledeLines.length * lineHeight * 1.02 +
          12
        let y = height / 2 - blockH / 2 + lineHeight / 2
        const leftX = width * 0.16
        headlineLines.forEach((line) => {
          this.drawStyledLine(ctx, line, leftX, y + driftY, 'left', headlineSize, textColor, textAlpha)
          y += lineHeight * 1.05
        })
        if (content.payload.byline) {
          y += 8
          ctx.save()
          ctx.globalAlpha = textAlpha * 0.45
          ctx.font = `${Math.round(baseFontSize * 0.5)}px sans-serif`
          ctx.fillStyle = textColor
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(content.payload.byline, leftX, y)
          ctx.restore()
          y += 14
          ctx.save()
          ctx.strokeStyle = textColor
          ctx.globalAlpha = 0.2 * textAlpha
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(leftX, y)
          ctx.lineTo(leftX + Math.min(192, width * 0.2), y)
          ctx.stroke()
          ctx.restore()
          y += 16
        }
        y += 6
        ledeLines.forEach((line) => {
          this.drawStyledLine(ctx, line, leftX, y + driftY, 'left', ledeSize, textColor, textAlpha * 0.92)
          y += lineHeight * 1.02
        })
        return
      }
    }

    // Pull quote: oversized line with vertical rule
    if (options.layoutStyle === 'pull-quote') {
      const content = options.layoutContent
      if (content?.layoutStyle === 'pull-quote' && content.payload.quote) {
        const quoteChars = this.compileToStyledChars(content.payload.quote, font, formatFlags)
        const quoteLines = this.wrapStyledChars(ctx, quoteChars, width * 0.62, baseFontSize * 1.25)
        const totalH = quoteLines.length * lineHeight * 1.15
        let y = height / 2 - totalH / 2 + lineHeight / 2
        const ruleX = width * 0.22
        const textX = width * 0.26
        ctx.save()
        ctx.strokeStyle = textColor
        ctx.globalAlpha = 0.35 * textAlpha
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(ruleX, y - lineHeight / 2)
        ctx.lineTo(ruleX, y + totalH - lineHeight)
        ctx.stroke()
        ctx.restore()
        quoteLines.forEach((line) => {
          this.drawStyledLine(ctx, line, textX, y + driftY, 'left', baseFontSize * 1.25, textColor, textAlpha)
          y += lineHeight * 1.15
        })
        return
      }

      const flatChars = phraseLines.flat()
      const quoteLines = this.wrapStyledChars(ctx, flatChars, width * 0.62, baseFontSize * 1.25)
      const totalH = quoteLines.length * lineHeight * 1.15
      let y = height / 2 - totalH / 2 + lineHeight / 2
      const ruleX = width * 0.22
      const textX = width * 0.26
      ctx.save()
      ctx.strokeStyle = textColor
      ctx.globalAlpha = 0.35 * textAlpha
      ctx.lineWidth = Math.max(3, baseFontSize * 0.08)
      ctx.beginPath()
      ctx.moveTo(ruleX, y - lineHeight * 0.4)
      ctx.lineTo(ruleX, y + totalH - lineHeight * 0.5)
      ctx.stroke()
      ctx.restore()
      quoteLines.forEach((line) => {
        this.drawStyledLine(ctx, line, textX, y + driftY, 'left', baseFontSize * 1.25, textColor, textAlpha)
        y += lineHeight * 1.15
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
