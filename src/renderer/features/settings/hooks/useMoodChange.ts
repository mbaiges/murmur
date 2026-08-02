import { useCallback } from 'react'
import type { MurmurConfig } from '@core/domain/types'
import {
  CYBERPUNK_TERMINAL_PROMPT,
  GOTHIC_PURPLE_PROSE_PROMPT,
  WORST_NEWS_TITLE_PROMPT,
  ZEN_KOAN_PROMPT
} from '@core/domain/types'

export function useMoodChange(
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>,
  syncDraftFromPrompt: (systemPrompt: string) => void
) {
  return useCallback(
    (moodName: string) => {
      if (moodName === 'Custom') return

      let updates: Partial<MurmurConfig> = {}
      if (moodName === 'Rogue Terminal') {
        updates = {
          systemPrompt: CYBERPUNK_TERMINAL_PROMPT,
          theme: 'Cyberpunk',
          fontFamily: 'Monospace',
          layoutStyle: 'editorial-left',
          animation: 'Typewriter',
          audioFeedback: true,
          vignetteStyle: 'dramatic',
          noiseIntensity: 'heavy',
          enableBold: true,
          enableItalic: true,
          enableDifferentFonts: true,
          enableNewlines: true
        }
      } else if (moodName === 'Zen Study') {
        updates = {
          systemPrompt: ZEN_KOAN_PROMPT,
          theme: 'Parchment',
          fontFamily: 'EB Garamond',
          layoutStyle: 'book-cover',
          animation: 'Fade',
          audioFeedback: false,
          vignetteStyle: 'soft',
          noiseIntensity: 'subtle',
          enableBold: true,
          enableItalic: true,
          enableDifferentFonts: true,
          enableNewlines: true
        }
      } else if (moodName === 'Gothic Novelist') {
        updates = {
          systemPrompt: GOTHIC_PURPLE_PROSE_PROMPT,
          theme: 'Drift',
          fontFamily: 'Playfair Display',
          layoutStyle: 'asymmetrical',
          animation: 'DriftIn',
          audioFeedback: false,
          vignetteStyle: 'dramatic',
          noiseIntensity: 'subtle',
          enableBold: true,
          enableItalic: true,
          enableDifferentFonts: true,
          enableNewlines: true
        }
      } else if (moodName === 'Clickbait Press') {
        updates = {
          systemPrompt: WORST_NEWS_TITLE_PROMPT,
          theme: 'Crimson',
          fontFamily: 'Outfit',
          layoutStyle: 'centered',
          animation: 'Fade',
          audioFeedback: false,
          vignetteStyle: 'none',
          noiseIntensity: 'none',
          enableBold: true,
          enableItalic: true,
          enableDifferentFonts: true,
          enableNewlines: true
        }
      }

      if (updates.systemPrompt) {
        syncDraftFromPrompt(updates.systemPrompt)
      }
      void saveConfig(updates)
    },
    [saveConfig, syncDraftFromPrompt]
  )
}
