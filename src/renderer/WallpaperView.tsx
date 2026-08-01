import React, { useState, useEffect } from 'react'
import { MurmurConfig, MurmurState } from '../domain/types'
import { splitPhraseLines } from '../shared/phraseFormatFlags'
import { splitFlatCharsAtWordMidpoint, splitPlainPhraseHeadlineDeck } from '../shared/phraseLayoutSplit'
import { phraseToPlainText } from '../shared/phrasePlainText'

const api = (window as any).api

const createSeededRandom = (seedStr: string) => {
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

interface StyledChar {
  char: string
  isBold: boolean
  isItalic: boolean
  isCode: boolean
  fontClass: string
}

interface StyledRun {
  text: string
  isBold: boolean
  isItalic: boolean
  isCode: boolean
  fontClass: string
}

// Compile raw markdown string to flat array of styled characters
function compileToStyledChars(
  text: string,
  defaultFontClass: string,
  config: MurmurConfig,
  isBold = false,
  isItalic = false,
  isCode = false,
  currentFontClass = ''
): StyledChar[] {
  if (!text) return []

  const result: StyledChar[] = []
  let currentText = text

  while (currentText.length > 0) {
    const boldIdx = currentText.indexOf('**')
    const italicIdx = currentText.indexOf('*')
    const codeIdx = currentText.indexOf('`')
    const fontStartIdx = currentText.indexOf('[font:')

    const indices = [
      { type: 'font', index: fontStartIdx },
      { type: 'bold', index: boldIdx },
      { type: 'code', index: codeIdx },
      { type: 'italic', index: italicIdx }
    ].filter((item) => item.index !== -1)

    if (indices.length === 0) {
      for (const char of currentText) {
        result.push({
          char,
          isBold,
          isItalic,
          isCode,
          fontClass: currentFontClass || defaultFontClass
        })
      }
      break
    }

    indices.sort((a, b) => {
      if (a.index !== b.index) {
        return a.index - b.index
      }
      const priority: Record<string, number> = { font: 0, bold: 1, code: 2, italic: 3 }
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
          isCode,
          fontClass: currentFontClass || defaultFontClass
        })
      }
      currentText = currentText.substring(nextMatch.index)
    }

    if (nextMatch.type === 'bold') {
      const closeIdx = currentText.indexOf('**', 2)
      if (closeIdx !== -1) {
        const inner = currentText.substring(2, closeIdx)
        result.push(
          ...compileToStyledChars(
            inner,
            defaultFontClass,
            config,
            config.enableBold ? true : isBold,
            isItalic,
            isCode,
            currentFontClass
          )
        )
        currentText = currentText.substring(closeIdx + 2)
      } else {
        result.push({ char: '*', isBold, isItalic, isCode, fontClass: currentFontClass || defaultFontClass })
        result.push({ char: '*', isBold, isItalic, isCode, fontClass: currentFontClass || defaultFontClass })
        currentText = currentText.substring(2)
      }
    } else if (nextMatch.type === 'italic') {
      const closeIdx = currentText.indexOf('*', 1)
      if (closeIdx !== -1) {
        const inner = currentText.substring(1, closeIdx)
        result.push(
          ...compileToStyledChars(
            inner,
            defaultFontClass,
            config,
            isBold,
            config.enableItalic ? true : isItalic,
            isCode,
            currentFontClass
          )
        )
        currentText = currentText.substring(closeIdx + 1)
      } else {
        result.push({ char: '*', isBold, isItalic, isCode, fontClass: currentFontClass || defaultFontClass })
        currentText = currentText.substring(1)
      }
    } else if (nextMatch.type === 'code') {
      const closeIdx = currentText.indexOf('`', 1)
      if (closeIdx !== -1) {
        const inner = currentText.substring(1, closeIdx)
        const useCode = config.enableDifferentFonts
        result.push(
          ...compileToStyledChars(
            inner,
            useCode ? 'font-monospace' : defaultFontClass,
            config,
            isBold,
            isItalic,
            useCode ? true : isCode,
            useCode ? 'font-monospace' : currentFontClass
          )
        )
        currentText = currentText.substring(closeIdx + 1)
      } else {
        result.push({ char: '`', isBold, isItalic, isCode, fontClass: currentFontClass || defaultFontClass })
        currentText = currentText.substring(1)
      }
    } else if (nextMatch.type === 'font') {
      const closeBracketIdx = currentText.indexOf(']')
      const closeFontIdx = currentText.indexOf('[/font]')
      if (closeBracketIdx !== -1 && closeFontIdx !== -1 && closeFontIdx > closeBracketIdx) {
        const fontName = currentText.substring(6, closeBracketIdx)
        const innerText = currentText.substring(closeBracketIdx + 1, closeFontIdx)
        
        let overrideClass = defaultFontClass
        if (config.enableDifferentFonts) {
          if (fontName === 'EB Garamond') overrideClass = 'font-eb-garamond'
          else if (fontName === 'Playfair Display') overrideClass = 'font-playfair'
          else if (fontName === 'Outfit') overrideClass = 'font-outfit'
          else if (fontName === 'Garamond Bold') overrideClass = 'font-garamond-bold'
          else if (fontName === 'Monospace') overrideClass = 'font-monospace'
        }

        result.push(
          ...compileToStyledChars(
            innerText,
            defaultFontClass,
            config,
            isBold,
            isItalic,
            isCode,
            config.enableDifferentFonts ? overrideClass : currentFontClass
          )
        )
        currentText = currentText.substring(closeFontIdx + 7)
      } else {
        const rawPart = currentText.substring(0, 6)
        for (const char of rawPart) {
          result.push({ char, isBold, isItalic, isCode, fontClass: currentFontClass || defaultFontClass })
        }
        currentText = currentText.substring(6)
      }
    }
  }

  return result
}

// Group contiguous styled characters to HTML elements for efficient rendering
function renderStyledChars(chars: StyledChar[]): React.ReactNode {
  if (chars.length === 0) return null

  const runs: StyledRun[] = []
  let currentRun: StyledRun | null = null

  for (const char of chars) {
    if (
      currentRun &&
      currentRun.isBold === char.isBold &&
      currentRun.isItalic === char.isItalic &&
      currentRun.isCode === char.isCode &&
      currentRun.fontClass === char.fontClass
    ) {
      currentRun.text += char.char
    } else {
      if (currentRun) {
        runs.push(currentRun)
      }
      currentRun = {
        text: char.char,
        isBold: char.isBold,
        isItalic: char.isItalic,
        isCode: char.isCode,
        fontClass: char.fontClass
      }
    }
  }
  if (currentRun) {
    runs.push(currentRun)
  }

  return (
    <>
      {runs.map((run, idx) => {
        let node: React.ReactNode = <span>{run.text}</span>
        if (run.isCode) {
          node = <code className="font-monospace bg-black/10 px-1 rounded text-sm">{node}</code>
        }
        if (run.isItalic) {
          node = <em className="italic">{node}</em>
        }
        if (run.isBold) {
          node = <strong className="font-extrabold">{node}</strong>
        }
        
        return (
          <span key={idx} className={run.fontClass}>
            {node}
          </span>
        )
      })}
    </>
  )
}

function renderSlicedPhrase(phraseLines: StyledChar[][], visibleCount: number): React.ReactNode {
  let remaining = visibleCount
  
  return (
    <>
      {phraseLines.map((line, lineIdx) => {
        if (remaining <= 0) {
          return <div key={lineIdx} className="min-h-[1.5em] w-full" />
        }
        
        const lineChars = line.slice(0, remaining)
        remaining -= line.length
        
        return (
          <div key={lineIdx} className="min-h-[1.5em] w-full">
            {renderStyledChars(lineChars)}
          </div>
        )
      })}
    </>
  )
}

export default function WallpaperView() {
  const [config, setConfig] = useState<MurmurConfig | null>(null)
  const [state, setState] = useState<MurmurState | null>(null)
  const [monitorId, setMonitorId] = useState<string>('')
  const [phraseLines, setPhraseLines] = useState<StyledChar[][]>([])
  const [visibleCount, setVisibleCount] = useState<number>(0)
  const [activePhrase, setActivePhrase] = useState<string>('')
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false)

  useEffect(() => {
    // 1. Get monitorId from search parameters
    const params = new URLSearchParams(window.location.search)
    const mId = params.get('monitorId') || ''
    setMonitorId(mId)

    // 2. Fetch initial config and state
    if (api) {
      api.getConfig().then(setConfig).catch(console.error)
      api.getState().then(setState).catch(console.error)

      // 3. Listen to state updates
      const removeStateListener = api.onStateUpdated((updatedState: MurmurState) => {
        setState(updatedState)
      })

      // 4. Listen to live config updates
      const removeConfigListener = api.onConfigUpdated((updatedConfig: MurmurConfig) => {
        setConfig(updatedConfig)
      })

      return () => {
        removeStateListener()
        removeConfigListener()
      }
    }
  }, [])

  // Transition helper to fade out the phrase before swapping and typing the new one
  useEffect(() => {
    if (!state || !monitorId) return
    const incomingPhrase = state.lastPhrases[monitorId] || 'Surrealism is the quiet hum of the world'

    if (!activePhrase) {
      // First load: set active phrase immediately without fading out
      setActivePhrase(incomingPhrase)
      return
    }

    if (incomingPhrase !== activePhrase) {
      // Incoming phrase is different: fade out first
      setIsFadingOut(true)
      const timeout = setTimeout(() => {
        setActivePhrase(incomingPhrase)
        setIsFadingOut(false)
      }, 500) // 500ms fade-out duration
      return () => clearTimeout(timeout)
    }
  }, [state?.lastPhrases?.[monitorId], monitorId])

  // 5. Compile phrase and drive Typewriter reveals
  useEffect(() => {
    if (!config || !activePhrase) return

    // Font class mapping
    let defaultFontClass = 'font-serif'
    if (config.fontFamily === 'EB Garamond') defaultFontClass = 'font-eb-garamond'
    else if (config.fontFamily === 'Playfair Display') defaultFontClass = 'font-playfair'
    else if (config.fontFamily === 'Outfit') defaultFontClass = 'font-outfit'
    else if (config.fontFamily === 'Garamond Bold') defaultFontClass = 'font-garamond-bold'
    else if (config.fontFamily === 'Monospace') defaultFontClass = 'font-monospace'

    const lines = splitPhraseLines(activePhrase, config.enableNewlines)
    const compiled = lines.map(line => compileToStyledChars(line, defaultFontClass, config))
    
    setPhraseLines(compiled)

    const total = compiled.reduce((acc, l) => acc + l.length, 0)

    if (config.animation === 'Typewriter') {
      setVisibleCount(0)
      let count = 0
      
      const playBlipSound = () => {
        if (!config.audioFeedback) return
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(140 + Math.random() * 40, audioCtx.currentTime)
          
          gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08)
          
          osc.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          
          osc.start()
          osc.stop(audioCtx.currentTime + 0.08)
        } catch (e) {
          console.error(e)
        }
      }

      const flatChars = compiled.flat()

      const timer = setInterval(() => {
        if (count < total) {
          const nextChar = flatChars[count]
          count++
          setVisibleCount(count)
          if (nextChar && nextChar.char !== ' ') {
            playBlipSound()
          }
        } else {
          clearInterval(timer)
        }
      }, 45)

      return () => clearInterval(timer)
    } else {
      setVisibleCount(total)
    }
  }, [
    activePhrase,
    config?.fontFamily,
    config?.animation,
    config?.audioFeedback,
    config?.enableBold,
    config?.enableItalic,
    config?.enableNewlines,
    config?.enableDifferentFonts
  ])

  if (!config || !state) {
    return <div className="w-full h-full bg-slate-950" />
  }

  // Get active monitor settings
  const monitorConf = config.monitors.find((m) => m.id === monitorId)
  const isEnabled = monitorConf ? monitorConf.enabled : true
  if (!isEnabled) {
    return <div className="w-full h-full bg-slate-950" />
  }

  const theme = monitorConf?.themeOverride || config.theme
  const isDark = ['Midnight', 'Drift', 'Static', 'Forest', 'Crimson', 'Cyberpunk', 'WarmGlow'].includes(theme)
  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const mutedColor = isDark ? 'text-white/40' : 'text-slate-700/60'

  // Helper to dynamically scale font size clamp values based on phrase length to avoid overflows
  const getScaledFontClamp = (minRem: number, vw: number, maxRem: number) => {
    const phraseLength = activePhrase.length
    let scale = 1.0
    if (phraseLength > 220) {
      scale = 0.55
    } else if (phraseLength > 130) {
      scale = 0.70
    } else if (phraseLength > 75) {
      scale = 0.85
    }

    return `clamp(${Number((minRem * scale).toFixed(2))}rem, ${Number((vw * scale).toFixed(2))}vw, ${Number((maxRem * scale).toFixed(2))}rem)`
  }

  // Font class mapping
  let fontClass = 'font-serif'
  if (config.fontFamily === 'EB Garamond') fontClass = 'font-eb-garamond'
  else if (config.fontFamily === 'Playfair Display') fontClass = 'font-playfair'
  else if (config.fontFamily === 'Outfit') fontClass = 'font-outfit'
  else if (config.fontFamily === 'Garamond Bold') fontClass = 'font-garamond-bold'
  else if (config.fontFamily === 'Monospace') fontClass = 'font-monospace'

  // Text Alignment
  let alignmentClass = 'text-center items-center'
  if (config.textAlignment === 'left') alignmentClass = 'text-left items-start'
  else if (config.textAlignment === 'right') alignmentClass = 'text-right items-end'

  // Layout Style
  let layoutClass = 'w-full max-w-3xl px-16 justify-center'
  if (config.layoutStyle === 'editorial-left') {
    layoutClass = 'w-full max-w-xl pl-20 pr-6 justify-start items-start text-left'
  } else if (config.layoutStyle === 'editorial-right') {
    layoutClass = 'w-full max-w-xl pr-20 pl-6 justify-end items-end text-right'
  } else if (config.layoutStyle === 'scattered') {
    layoutClass = 'w-full h-full relative p-20'
  } else if (config.layoutStyle === 'split-spread') {
    layoutClass = 'w-full h-full max-w-none px-12 md:px-20 justify-center'
  } else if (config.layoutStyle === 'tabloid-stack') {
    layoutClass = 'w-full max-w-4xl px-12 justify-center items-center text-center'
  } else if (config.layoutStyle === 'pull-quote') {
    layoutClass = 'w-full max-w-3xl px-16 justify-center items-start'
  }

  // Animation Transition Classes
  let animClass = 'transition-all duration-1000'
  if (config.animation === 'Instant') animClass = 'transition-none'
  else if (config.animation === 'Fade') animClass = 'animate-fade-in'
  else if (config.animation === 'DriftIn') animClass = 'animate-drift-in'
  else if (config.animation === 'Morph') animClass = 'animate-morph-in'
  else if (config.animation === 'Typewriter') animClass = 'animate-typewriter-fade'
  else if (config.animation === 'Glitch') animClass = 'animate-glitch'

  const renderScatteredLayout = () => {
    if (phraseLines.length === 0) return null
    const flatChars = phraseLines.flat()
    const visibleChars = flatChars.slice(0, visibleCount)
    
    // Group visible chars to words split by space
    const words: StyledChar[][] = []
    let currentWord: StyledChar[] = []
    for (const char of visibleChars) {
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

    const phraseKey = state.lastPhrases[monitorId] || 'empty'
    const rand = createSeededRandom(phraseKey)

    return (
      <div className="w-full h-full relative">
        {words.map((wordChars, index) => {
          const x = 15 + rand() * 70
          const y = 20 + rand() * 60
          const rotation = (rand() - 0.5) * 20
          const scale = 0.8 + rand() * 0.6
          const opacity = 0.4 + rand() * 0.6

          return (
            <span
              key={`${phraseKey}_${index}`}
              className={`absolute select-none transform ${fontClass} ${textColor} ${animClass}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                opacity,
                fontSize: getScaledFontClamp(1.2, 2.5, 2.8),
                textShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {renderStyledChars(wordChars)}
            </span>
          )
        })}
      </div>
    )
  };

  const getAsymmetricalRuns = (chars: StyledChar[]) => {
    const words: StyledChar[][] = []
    let currentWord: StyledChar[] = []
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

    const chunkCount = Math.min(3, words.length)
    const lines: StyledChar[][] = []
    const chunkSize = Math.ceil(words.length / chunkCount)
    for (let i = 0; i < chunkCount; i++) {
      const lineWords = words.slice(i * chunkSize, (i + 1) * chunkSize)
      lines.push(lineWords.flat())
    }
    return lines
  }

  const renderAsymmetricalLayout = () => {
    const flatChars = phraseLines.flat()
    const chunks = getAsymmetricalRuns(flatChars)
    
    let remaining = visibleCount
    return (
      <div className={`flex flex-col w-full max-w-4xl space-y-6 ${animClass}`}>
        {chunks.map((chunk, index) => {
          let lineAlign = 'self-center text-center'
          if (index === 0) lineAlign = 'self-start text-left pl-6'
          else if (index === 2) lineAlign = 'self-end text-right pr-6'
          
          if (remaining <= 0) {
            return (
              <h1
                key={index}
                className={`${textColor} ${fontClass} ${lineAlign} leading-relaxed select-none tracking-wide antialiased min-h-[1.5em]`}
                style={{ fontSize: getScaledFontClamp(1.8, 3.8, 3.5) }}
              />
            )
          }

          const visibleChunk = chunk.slice(0, remaining)
          remaining -= chunk.length

          return (
            <h1
              key={index}
              className={`${textColor} ${fontClass} ${lineAlign} leading-relaxed select-none tracking-wide antialiased ${animClass}`}
              style={{ fontSize: getScaledFontClamp(1.8, 3.8, 3.5), textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            >
              {renderStyledChars(visibleChunk)}
            </h1>
          )
        })}
      </div>
    )
  }

  const renderBookCoverLayout = () => {
    return (
      <div className={`flex flex-col items-center text-center max-w-xl ${animClass}`}>
        <h1 
          className={`${textColor} ${fontClass} leading-loose select-none tracking-widest antialiased`}
          style={{ fontSize: getScaledFontClamp(1.4, 2.8, 2.4), textShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
        >
          {renderSlicedPhrase(phraseLines, visibleCount)}
        </h1>
        <div className={`h-[1px] w-24 my-10 bg-current opacity-20`} />
        {state.lastRefreshTime && (
          <p className={`text-[10px] tracking-widest uppercase font-sans ${mutedColor}`}>
            Murmur Conceptual Poetry  •  {state.lastRefreshTime}
          </p>
        )}
      </div>
    )
  }

  const renderClassicLayout = () => {
    return (
      <div className={`flex flex-col ${alignmentClass} ${animClass} w-full`}>
        <h1 
          className={`${textColor} ${fontClass} ${animClass} leading-relaxed select-none tracking-wide antialiased`}
          style={{ fontSize: getScaledFontClamp(1.6, 3.6, 3.2), textShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          {renderSlicedPhrase(phraseLines, visibleCount)}
        </h1>
      </div>
    )
  }

  const renderSplitSpreadLayout = () => {
    const flat = phraseLines.flat()
    const { left, right } = splitFlatCharsAtWordMidpoint(flat)
    let remaining = visibleCount
    const take = (chars: StyledChar[]) => {
      const slice = chars.slice(0, Math.max(0, remaining))
      remaining -= chars.length
      return slice
    }

    return (
      <div
        data-testid="layout-split-spread"
        className={`grid grid-cols-2 gap-10 w-full items-center min-h-[40vh] ${animClass}`}
      >
        <h1
          data-testid="layout-split-spread-left"
          className={`${textColor} ${fontClass} text-left leading-snug select-none tracking-tight antialiased`}
          style={{ fontSize: getScaledFontClamp(1.4, 3.2, 2.8) }}
        >
          {renderStyledChars(take(left))}
        </h1>
        <h1
          data-testid="layout-split-spread-right"
          className={`${textColor} ${fontClass} text-right leading-snug select-none tracking-tight antialiased`}
          style={{ fontSize: getScaledFontClamp(1.4, 3.2, 2.8) }}
        >
          {renderStyledChars(take(right))}
        </h1>
      </div>
    )
  }

  const renderTabloidStackLayout = () => {
    const plain = phraseToPlainText(activePhrase)
    const { headline, deck } = splitPlainPhraseHeadlineDeck(plain)
    const headlineChars = compileToStyledChars(headline, fontClass, config)
    const deckChars = deck
      ? compileToStyledChars(deck, fontClass, config)
      : []

    let remaining = visibleCount
    const headlineLen = headlineChars.length
    const headlineVisible = headlineChars.slice(0, Math.min(remaining, headlineLen))
    remaining -= headlineLen
    const deckVisible = deckChars.slice(0, Math.max(0, remaining))

    return (
      <div data-testid="layout-tabloid-stack" className={`flex flex-col items-center text-center space-y-6 ${animClass}`}>
        <h1
          data-testid="layout-tabloid-headline"
          className={`${textColor} ${fontClass} leading-tight select-none tracking-tight antialiased uppercase`}
          style={{ fontSize: getScaledFontClamp(2, 4.5, 4), textShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          {renderStyledChars(headlineVisible)}
        </h1>
        {deckChars.length > 0 && (
          <p
            data-testid="layout-tabloid-deck"
            className={`${mutedColor} font-serif italic max-w-2xl leading-relaxed select-none`}
            style={{ fontSize: getScaledFontClamp(1, 2.2, 1.75) }}
          >
            {renderStyledChars(deckVisible)}
          </p>
        )}
      </div>
    )
  }

  const renderPullQuoteLayout = () => {
    const flat = phraseLines.flat()
    const visible = flat.slice(0, visibleCount)
    return (
      <blockquote
        data-testid="layout-pull-quote"
        className={`border-l-4 border-current pl-8 py-2 ${textColor} ${fontClass} ${animClass} leading-snug select-none antialiased`}
        style={{
          fontSize: getScaledFontClamp(1.8, 4.2, 3.6),
          borderColor: 'currentColor',
          opacity: 0.95
        }}
      >
        {renderStyledChars(visible)}
      </blockquote>
    )
  }

  // Theme styles classes
  let bgThemeClass = ''
  if (theme === 'Midnight') bgThemeClass = 'bg-midnight-gradient animate-midnight-spin'
  else if (theme === 'Drift') bgThemeClass = 'bg-drift-gradient animate-drift-spin'
  else if (theme === 'Forest') bgThemeClass = 'bg-forest-gradient animate-forest-spin'
  else if (theme === 'Crimson') bgThemeClass = 'bg-crimson-gradient animate-crimson-spin'
  else if (theme === 'Cyberpunk') bgThemeClass = 'bg-cyberpunk-gradient animate-cyberpunk-spin'
  else if (theme === 'WarmGlow') bgThemeClass = 'bg-warmglow-gradient animate-warmglow-spin'
  else if (theme === 'Parchment') bgThemeClass = 'bg-[#f4efe2]'
  else if (theme === 'Blanc') bgThemeClass = 'bg-[#f8f9fa]'
  else bgThemeClass = 'bg-slate-950'

  // Vignette Class Mapping
  let vignetteClass = ''
  if (config.vignetteStyle === 'soft') vignetteClass = 'bg-vignette-soft'
  else if (config.vignetteStyle === 'medium') vignetteClass = 'bg-vignette-medium'
  else if (config.vignetteStyle === 'dramatic') vignetteClass = 'bg-vignette-dramatic'

  return (
    <div className={`w-full h-full flex items-center justify-center relative overflow-hidden select-none ${bgThemeClass}`}>
      
      {/* 1. Grain/Noise Overlay */}
      {config.noiseIntensity !== 'none' && (
        <div className={`absolute inset-0 pointer-events-none mix-blend-overlay ${
          config.noiseIntensity === 'subtle' ? 'opacity-[0.035]' : 'opacity-[0.08]'
        } bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F200%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]`} />
      )}

      {/* 2. Vignette Overlay */}
      {config.vignetteStyle !== 'none' && (
        <div className={`absolute inset-0 pointer-events-none ${vignetteClass}`} />
      )}

      {/* 3. Date & Time Widget (Top Right) */}
      {config.overlays.dateTime && (
        <div className={`absolute top-12 right-12 text-right ${textColor} font-sans`}>
          <ClockWidget />
        </div>
      )}

      {/* 4. Concepts Sampled (Bottom Left) */}
      {config.overlays.inspiringHeadlines && state.lastRefreshTime && (
        <div className={`absolute bottom-12 left-12 space-y-1.5 ${mutedColor} max-w-sm font-sans select-none animate-fade-in`}>
          <p className="text-[10px] font-bold tracking-widest uppercase">Concepts Sampled</p>
          <div className="text-xs space-y-1">
            {state.lastHeadlines && state.lastHeadlines[monitorId] && state.lastHeadlines[monitorId].length > 0 ? (
              state.lastHeadlines[monitorId].map((headline, idx) => (
                <p key={idx}>• {headline}</p>
              ))
            ) : (
              <>
                <p>• Quantum fluctuations in regulatory bounds</p>
                <p>• Artificial gravity drifts in local news</p>
                <p>• Micro-aggregations of poetry feeds</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. Source Credits (Bottom Right) */}
      {config.overlays.sourceCredit && state.lastRefreshTime && (
        <div className={`absolute bottom-12 right-12 text-right ${mutedColor} font-sans text-xs select-none animate-fade-in`}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1">Sources Contributed</p>
          <p className="italic">
            {state.lastSources && state.lastSources[monitorId] && state.lastSources[monitorId].length > 0
              ? state.lastSources[monitorId].join(', ')
              : 'BBC News, NYT Science'}
          </p>
        </div>
      )}

      {/* 6. Main Poetic Phrase Container */}
      <div className={`flex flex-col items-center select-none transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'} ${layoutClass}`}>
        {config.layoutStyle === 'scattered' ? (
          renderScatteredLayout()
        ) : config.layoutStyle === 'asymmetrical' ? (
          renderAsymmetricalLayout()
        ) : config.layoutStyle === 'book-cover' ? (
          renderBookCoverLayout()
        ) : config.layoutStyle === 'split-spread' ? (
          renderSplitSpreadLayout()
        ) : config.layoutStyle === 'tabloid-stack' ? (
          renderTabloidStackLayout()
        ) : config.layoutStyle === 'pull-quote' ? (
          renderPullQuoteLayout()
        ) : (
          renderClassicLayout()
        )}
      </div>
    </div>
  )
}

function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  const formattedTime = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider uppercase opacity-60">{formattedDate}</p>
      <p className="text-2xl font-bold tracking-widest mt-1 font-mono">{formattedTime}</p>
    </div>
  )
}
