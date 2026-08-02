import React, { useEffect, useMemo, useState } from 'react'
import type { LayoutContentEnvelope, MurmurConfig } from '@core/domain/types'
import { phraseToPlainText } from '@core/lib/phrase/phrasePlainText'
import { fontFamilyPreviewClass, themePreviewIsDark } from './wallpaperThemePreview'
import { previewPhraseFontSizeVw } from './wallpaperPreviewScale'
import { playPreviewTypewriterBlip } from './previewTypewriterSound'
import { closeSharedTypewriterAudio } from './typewriterBlipSound'

type WallpaperPreviewLayoutBodyProps = {
  config: MurmurConfig
  phrase: string
  layoutEnvelope: LayoutContentEnvelope | null
  replayKey: string
}

function takeVisible(text: string, remaining: number): { shown: string; remaining: number } {
  if (remaining <= 0) return { shown: '', remaining: 0 }
  if (text.length <= remaining) return { shown: text, remaining: remaining - text.length }
  return { shown: text.slice(0, remaining), remaining: 0 }
}

function previewAnimClass(animation: MurmurConfig['animation']): string {
  switch (animation) {
    case 'Instant':
      return ''
    case 'Fade':
      return 'animate-fade-in'
    case 'DriftIn':
      return 'animate-drift-in'
    case 'Morph':
      return 'animate-morph-in'
    case 'Typewriter':
      return 'animate-typewriter-fade'
    case 'Glitch':
      return 'animate-glitch'
    default:
      return 'animate-fade-in'
  }
}

function fontClassFor(config: MurmurConfig): string {
  return fontFamilyPreviewClass(config.fontFamily)
}

export default function WallpaperPreviewLayoutBody({
  config,
  phrase,
  layoutEnvelope,
  replayKey
}: WallpaperPreviewLayoutBodyProps) {
  const plain = phraseToPlainText(phrase).trim() || 'Your phrase will appear here after refresh.'
  const dark = themePreviewIsDark(config.theme)
  const textColor = dark ? 'text-white/90' : 'text-slate-900/90'
  const mutedColor = dark ? 'text-white/45' : 'text-slate-600/80'
  const animClass = previewAnimClass(config.animation)

  const typewriterSource = useMemo(() => {
    if (layoutEnvelope?.payload) {
      return Object.values(layoutEnvelope.payload).join('')
    }
    return plain
  }, [layoutEnvelope, plain])

  const [visibleCount, setVisibleCount] = useState(typewriterSource.length)

  useEffect(() => () => closeSharedTypewriterAudio(), [])

  useEffect(() => {
    if (config.animation !== 'Typewriter') {
      setVisibleCount(typewriterSource.length)
      return
    }

    setVisibleCount(0)
    let count = 0
    const timer = setInterval(() => {
      if (count < typewriterSource.length) {
        const ch = typewriterSource[count]
        count += 1
        setVisibleCount(count)
        if (ch !== ' ' && config.audioFeedback) {
          playPreviewTypewriterBlip()
        }
      } else {
        clearInterval(timer)
      }
    }, 45)

    return () => clearInterval(timer)
  }, [typewriterSource, config.animation, config.audioFeedback, replayKey])

  let remaining = visibleCount
  const show = (text: string) => {
    const { shown, remaining: next } = takeVisible(text, remaining)
    remaining = next
    return shown
  }

  const fontSizeMain = previewPhraseFontSizeVw(plain.length)
  const fontSizeLarge = previewPhraseFontSizeVw(Math.max(20, Math.floor(plain.length * 0.6)))
  const fontSizeSmall = previewPhraseFontSizeVw(Math.max(40, plain.length))

  const alignmentClass =
    config.textAlignment === 'left'
      ? 'text-left items-start'
      : config.textAlignment === 'right'
        ? 'text-right items-end'
        : 'text-center items-center'

  const wrap = (node: React.ReactNode, layoutKey: string) => (
    <div key={`${replayKey}-${layoutKey}`} className={`w-full h-full flex flex-col justify-center ${animClass}`}>
      {node}
    </div>
  )

  const layout = config.layoutStyle

  if (layout === 'split-spread' && layoutEnvelope?.payload) {
    const left = layoutEnvelope.payload.left ?? plain
    const right = layoutEnvelope.payload.right ?? ''
    return wrap(
      <div className="grid grid-cols-2 gap-[3vw] w-full items-center min-h-[30vh] px-[4vw]">
        <p className={`${textColor} ${fontClassFor(config)} text-left leading-snug`} style={{ fontSize: fontSizeMain }}>
          {show(left)}
        </p>
        <p className={`${textColor} ${fontClassFor(config)} text-right leading-snug`} style={{ fontSize: fontSizeMain }}>
          {show(right)}
        </p>
      </div>,
      'split-spread'
    )
  }

  if (layout === 'tabloid-stack' && layoutEnvelope?.payload) {
    const { headline, deck, kicker } = layoutEnvelope.payload
    return wrap(
      <div className={`flex flex-col items-center text-center space-y-[2vh] px-[4vw] ${alignmentClass}`}>
        {kicker && (
          <p className={`${mutedColor} text-[10px] uppercase tracking-[0.25em] font-sans`}>{kicker}</p>
        )}
        <p
          className={`${textColor} ${fontClassFor(config)} uppercase leading-tight tracking-tight`}
          style={{ fontSize: fontSizeLarge }}
        >
          {show(headline ?? plain)}
        </p>
        {deck && (
          <p className={`${mutedColor} italic leading-relaxed max-w-[85%]`} style={{ fontSize: fontSizeSmall }}>
            {show(deck)}
          </p>
        )}
      </div>,
      'tabloid'
    )
  }

  if (layout === 'pull-quote' && layoutEnvelope?.payload) {
    const quote = layoutEnvelope.payload.quote ?? plain
    return wrap(
      <blockquote
        className={`border-l-4 border-current pl-[3vw] py-[1vh] mx-[6vw] ${textColor} ${fontClassFor(config)} leading-snug`}
        style={{ fontSize: fontSizeMain }}
      >
        {show(quote)}
        {layoutEnvelope.payload.attribution && (
          <footer className={`mt-[1vh] text-[10px] ${mutedColor} not-italic font-sans`}>
            — {layoutEnvelope.payload.attribution}
          </footer>
        )}
      </blockquote>,
      'pull-quote'
    )
  }

  if (layout === 'feature-opener' && layoutEnvelope?.payload) {
    const { section, headline, deck } = layoutEnvelope.payload
    return wrap(
      <div className="flex flex-col items-start gap-[2vh] max-w-[75%] px-[6vw] pt-[4vh] text-left">
        {section && <p className={`${mutedColor} text-[9px] uppercase tracking-[0.35em] font-sans`}>{section}</p>}
        <p className={`${textColor} ${fontClassFor(config)} leading-[0.95] tracking-tight`} style={{ fontSize: fontSizeLarge }}>
          {show(headline ?? plain)}
        </p>
        {deck && (
          <p className={`${mutedColor} italic leading-relaxed`} style={{ fontSize: fontSizeSmall }}>
            {show(deck)}
          </p>
        )}
      </div>,
      'feature-opener'
    )
  }

  if (layout === 'sidebar-rail' && layoutEnvelope?.payload) {
    const main = layoutEnvelope.payload.main ?? plain
    const sidebar = layoutEnvelope.payload.sidebar ?? ''
    return wrap(
      <div className="grid grid-cols-[1.4fr_0.9fr] gap-[4vw] w-full px-[5vw] items-center">
        <p className={`${textColor} ${fontClassFor(config)} text-left leading-snug`} style={{ fontSize: fontSizeMain }}>
          {show(main)}
        </p>
        <aside
          className={`border-l-2 border-current pl-[2vw] ${mutedColor} italic leading-relaxed text-left ${dark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'} rounded-r-sm py-[1vh]`}
          style={{ fontSize: fontSizeSmall }}
        >
          {show(sidebar)}
        </aside>
      </div>,
      'sidebar-rail'
    )
  }

  if (layout === 'byline-lede' && layoutEnvelope?.payload) {
    const { headline, byline, lede } = layoutEnvelope.payload
    return wrap(
      <article className="flex flex-col items-start gap-[1.2vh] max-w-[80%] px-[6vw] text-left">
        <p className={`${textColor} ${fontClassFor(config)} leading-tight tracking-tight`} style={{ fontSize: fontSizeMain }}>
          {show(headline ?? plain)}
        </p>
        {byline && <p className={`${mutedColor} text-[9px] uppercase tracking-[0.2em] font-sans`}>{byline}</p>}
        {lede && (
          <p className={`${mutedColor} leading-relaxed`} style={{ fontSize: fontSizeSmall }}>
            {show(lede)}
          </p>
        )}
      </article>,
      'byline-lede'
    )
  }

  if (layout === 'scattered') {
    const words = plain.split(/\s+/).filter(Boolean).slice(0, 8)
    let scatterRemaining = visibleCount
    return wrap(
      <div className="relative w-full h-full">
        {words.map((word, i) => {
          const { shown, remaining: next } = takeVisible(word + (i < words.length - 1 ? ' ' : ''), scatterRemaining)
          scatterRemaining = next
          const x = 12 + (i * 17) % 70
          const y = 18 + (i * 23) % 55
          return (
            <span
              key={`${replayKey}-w-${i}`}
              className={`absolute ${textColor} ${fontClassFor(config)} ${animClass}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: fontSizeSmall
              }}
            >
              {shown}
            </span>
          )
        })}
      </div>,
      'scattered'
    )
  }

  if (layout === 'asymmetrical') {
    const words = plain.split(/\s+/).filter(Boolean)
    const chunkSize = Math.max(1, Math.ceil(words.length / 3))
    const lines = [0, 1, 2].map((i) => words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ')).filter(Boolean)
    return wrap(
      <div className="flex flex-col w-full max-w-[85%] space-y-[2vh] px-[5vw]">
        {lines.map((line, index) => {
          const align =
            index === 0 ? 'self-start text-left' : index === 2 ? 'self-end text-right' : 'self-center text-center'
          return (
            <p
              key={`${replayKey}-a-${index}`}
              className={`${textColor} ${fontClassFor(config)} ${align} leading-relaxed ${animClass}`}
              style={{ fontSize: fontSizeMain }}
            >
              {show(line)}
            </p>
          )
        })}
      </div>,
      'asymmetrical'
    )
  }

  if (layout === 'book-cover') {
    return wrap(
      <div className={`flex flex-col items-center text-center max-w-[70%] px-[4vw] ${animClass}`}>
        <p className={`${textColor} ${fontClassFor(config)} leading-loose tracking-widest`} style={{ fontSize: fontSizeSmall }}>
          {show(plain)}
        </p>
        <div className={`h-px w-16 my-[3vh] bg-current opacity-20`} />
      </div>,
      'book-cover'
    )
  }

  let layoutAlign = `flex flex-col w-full max-w-[85%] px-[6vw] ${alignmentClass}`
  if (layout === 'editorial-left') {
    layoutAlign = 'flex flex-col w-full max-w-[55%] pl-[8vw] pr-[3vw] items-start text-left'
  } else if (layout === 'editorial-right') {
    layoutAlign = 'flex flex-col w-full max-w-[55%] pr-[8vw] pl-[3vw] items-end text-right ml-auto'
  }

  return wrap(
    <div className={layoutAlign}>
      <p
        className={`${textColor} ${fontClassFor(config)} leading-relaxed tracking-wide ${animClass}`}
        style={{ fontSize: fontSizeMain, textWrap: 'balance' }}
      >
        {show(plain)}
      </p>
    </div>,
    layout
  )
}
