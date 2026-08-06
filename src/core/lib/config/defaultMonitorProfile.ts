import { DEFAULT_SYSTEM_PROMPT } from '../../domain/prompts'
import type { MonitorProfile } from '../../domain/types'
import { EXAMPLE_RSS_FEEDS } from '../presets/exampleFeeds'

export function getDefaultMonitorProfile(overrides?: Partial<MonitorProfile>): MonitorProfile {
  return {
    feeds: [...EXAMPLE_RSS_FEEDS],
    language: 'auto',
    theme: 'Midnight',
    animation: 'Fade',
    overlays: { dateTime: true, sourceCredit: false, inspiringHeadlines: false, phraseWidget: false },
    headlineSampleSize: 15,
    fontFamily: 'EB Garamond',
    textAlignment: 'center',
    layoutStyle: 'centered',
    vignetteStyle: 'none',
    audioFeedback: true,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    enableBold: true,
    enableItalic: true,
    enableNewlines: true,
    enableDifferentFonts: false,
    noiseIntensity: 'none',
    tonePreset: 'none',
    customToneText: '',
    backgroundMode: 'gradient',
    backgroundPresetId: 'Abstract mood',
    customBackgroundPrompt: '',
    backgroundPhotoRelPath: '',
    backgroundTemplateVars: {},
    aiPhraseInImage: false,
    aiPhraseInImagePreset: 'poem',
    showHeroPhrase: true,
    ...overrides
  }
}
