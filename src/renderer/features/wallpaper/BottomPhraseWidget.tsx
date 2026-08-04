import React, { useLayoutEffect, useRef, useState } from 'react'
import { phraseToPlainText } from '@core/lib/phrase/phrasePlainText'

type BottomPhraseWidgetProps = {
  phrase: string
  mutedColorClass: string
  maxHeightPx?: number
}

/** Bottom-center phrase caption; shrinks font only when text would overflow its box. */
export default function BottomPhraseWidget({
  phrase,
  mutedColorClass,
  maxHeightPx = 72
}: BottomPhraseWidgetProps) {
  const plain = phraseToPlainText(phrase).trim()
  const bodyRef = useRef<HTMLParagraphElement>(null)
  const [fontPx, setFontPx] = useState(12)

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el || !plain) return

    let size = 12
    el.style.fontSize = `${size}px`
    const maxH = maxHeightPx
    while (size > 8 && el.scrollHeight > maxH) {
      size -= 1
      el.style.fontSize = `${size}px`
    }
    setFontPx(size)
  }, [plain, maxHeightPx])

  if (!plain) return null

  return (
    <div
      className={`text-center ${mutedColorClass} font-sans select-none animate-fade-in w-full min-w-0`}
      data-testid="widget-phrase-caption"
    >
      <p className="text-[10px] font-bold tracking-widest uppercase mb-1">Current phrase</p>
      <p
        ref={bodyRef}
        className="italic leading-snug mx-auto max-w-full"
        style={{ fontSize: fontPx, maxHeight: maxHeightPx, overflow: 'hidden' }}
      >
        {plain}
      </p>
    </div>
  )
}
