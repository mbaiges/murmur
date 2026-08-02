import React from 'react'
import type { MurmurConfig, ThemeName } from '@core/domain/types'
import { activeMoodPresetLabel } from '../hooks/moodPresetLabel'
import SettingsSelect from '../components/SettingsSelect'

type AppearanceTabProps = {
  config: MurmurConfig
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
  onMoodChange: (moodName: string) => void
  hideMoodPreset?: boolean
  hideFormatting?: boolean
  showPageHeader?: boolean
}

export default function AppearanceTab({
  config,
  saveConfig,
  onMoodChange,
  hideMoodPreset = false,
  hideFormatting = false,
  showPageHeader = true
}: AppearanceTabProps) {
  return (
<div className="max-w-2xl space-y-8">
              {showPageHeader && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Appearance</h2>
                <p className="text-slate-400 text-sm">Customize visual style, typography layout, text formatting, and vignette overlays.</p>
              </div>
              )}

              {!hideMoodPreset && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Aesthetic Mood Preset</h3>
                  <p className="text-xs text-slate-400">Instantly configure coordinated prompt, theme, font, layout, and animation settings.</p>
                </div>
                <SettingsSelect
                  value={activeMoodPresetLabel(config)}
                  onChange={(e) => onMoodChange(e.target.value)}
                >
                  <option value="Custom">Custom (Manual adjustments)</option>
                  <option value="Rogue Terminal">🟢 Rogue Terminal (Cyberpunk Aesthetic)</option>
                  <option value="Zen Study">🪶 Zen Study (Minimalist Paper Aesthetic)</option>
                  <option value="Gothic Novelist">🌁 Gothic Novelist (Moody Literary Aesthetic)</option>
                  <option value="Clickbait Press">🚨 Clickbait Press (Satirical News Aesthetic)</option>
                </SettingsSelect>
              </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                {/* Theme & Fonts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Default Theme</label>
                    <SettingsSelect
                      value={config.theme}
                      onChange={(e) => saveConfig({ theme: e.target.value as ThemeName })}
                    >
                      <option value="Midnight">Midnight (Dark Indigo Gradient)</option>
                      <option value="Drift">Drift (Ocean Wave Gradient)</option>
                      <option value="Forest">Forest (Deep Emerald Gradient)</option>
                      <option value="Crimson">Crimson (Luxurious Blood Red)</option>
                      <option value="Cyberpunk">Cyberpunk (Neon Purple/Cyan)</option>
                      <option value="WarmGlow">Warm Glow (Sunset Gradients)</option>
                      <option value="Parchment">Parchment (Warm Tan Paper)</option>
                      <option value="Blanc">Blanc (Minimalist Off-White)</option>
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Typography Font</label>
                    <SettingsSelect
                      value={config.fontFamily}
                      onChange={(e) => saveConfig({ fontFamily: e.target.value as any })}
                    >
                      <option value="EB Garamond">EB Garamond (Elegant Serif)</option>
                      <option value="Garamond Bold">Garamond Bold (Extra Heavy Editorial)</option>
                      <option value="Playfair Display">Playfair Display (Poetic Serif)</option>
                      <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                      <option value="Monospace">Monospace (Terminal Code)</option>
                    </SettingsSelect>
                  </div>
                </div>

                {/* Transition Animations & Audio */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transition Animation</label>
                    <SettingsSelect
                      value={config.animation}
                      onChange={(e) => saveConfig({ animation: e.target.value as any })}
                    >
                      <option value="Fade">Fade In</option>
                      <option value="DriftIn">Drift & Fade</option>
                      <option value="Morph">Morph (Scale & Fade)</option>
                      <option value="Typewriter">Typewriter Reveal</option>
                      <option value="Glitch">Glitch (Scrambled Neon)</option>
                      <option value="Instant">Instant Cut</option>
                    </SettingsSelect>
                  </div>
                  <div className="flex items-center justify-between pt-6">
                    <div>
                      <h5 className="text-sm font-medium text-white">Keyboard Audio Feedback</h5>
                      <p className="text-xs text-slate-500">Undertale typewriter sounds.</p>
                    </div>
                    <input
                      type="checkbox"
                      disabled={config.animation !== 'Typewriter'}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 disabled:opacity-50"
                      checked={config.audioFeedback}
                      onChange={(e) => saveConfig({ audioFeedback: e.target.checked })}
                    />
                  </div>
                </div>

                {/* Text Layout & Alignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Text Alignment</label>
                    <SettingsSelect
                      value={config.textAlignment}
                      onChange={(e) => saveConfig({ textAlignment: e.target.value as any })}
                    >
                      <option value="center">Centered</option>
                      <option value="left">Left Aligned</option>
                      <option value="right">Right Aligned</option>
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Layout Style</label>
                    <SettingsSelect
                      value={config.layoutStyle}
                      onChange={(e) => saveConfig({ layoutStyle: e.target.value as any })}
                    >
                      <optgroup label="Classic">
                        <option value="centered">Classic Centered</option>
                        <option value="editorial-left">Editorial Left Column</option>
                        <option value="editorial-right">Editorial Right Column</option>
                        <option value="asymmetrical">Asymmetrical Alternating</option>
                        <option value="book-cover">Editorial Book Cover</option>
                        <option value="scattered">Scattered Letters / Words</option>
                      </optgroup>
                      <optgroup label="Magazine &amp; news">
                        <option value="split-spread">Split Spread (left / right halves)</option>
                        <option value="tabloid-stack">Tabloid Stack (headline + deck)</option>
                        <option value="pull-quote">Pull Quote (oversized margin quote)</option>
                        <option value="feature-opener">Feature Opener (section + hero headline)</option>
                        <option value="sidebar-rail">Sidebar Rail (main column + margin note)</option>
                        <option value="byline-lede">Byline &amp; Lede (headline + credit + opening)</option>
                      </optgroup>
                    </SettingsSelect>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      Structured magazine layouts use editorial grids with dedicated AI fields.
                    </p>
                    <details className="text-[10px] text-slate-500 mt-1">
                      <summary className="cursor-pointer text-indigo-400/90 hover:text-indigo-300">About magazine layouts</summary>
                      <p className="mt-1 leading-relaxed">
                        Split spread, tabloid stack, pull quote, feature opener, sidebar rail, and byline/lede each map to structured JSON fields.
                      </p>
                    </details>
                  </div>
                  </div>

                {!hideFormatting && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phrase Formatting</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose which markup the AI may use. Changing these regenerates the phrase for the current headlines.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Bold emphasis</h5>
                      <p className="text-xs text-slate-500">Allow **bold** markers in generated phrases.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableBold}
                      onChange={(e) => saveConfig({ enableBold: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Italic emphasis</h5>
                      <p className="text-xs text-slate-500">Allow *italic* markers in generated phrases.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableItalic}
                      onChange={(e) => saveConfig({ enableItalic: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Multi-line layout</h5>
                      <p className="text-xs text-slate-500">Allow line breaks for poetic multi-line phrases.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableNewlines}
                      onChange={(e) => saveConfig({ enableNewlines: e.target.checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Mixed fonts</h5>
                      <p className="text-xs text-slate-500">Allow [font:…] tags for accent typography.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.enableDifferentFonts}
                      onChange={(e) => saveConfig({ enableDifferentFonts: e.target.checked })}
                    />
                  </div>
                </div>
                )}

                {/* Background Filters */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Grain / Noise Intensity</label>
                    <SettingsSelect
                      value={config.noiseIntensity}
                      onChange={(e) => saveConfig({ noiseIntensity: e.target.value as any })}
                    >
                      <option value="none">None (Clean Background)</option>
                      <option value="subtle">Subtle Grain (Atmospheric)</option>
                      <option value="heavy">Heavy Grain (Analog Film)</option>
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vignette Style</label>
                    <SettingsSelect
                      value={config.vignetteStyle}
                      onChange={(e) => saveConfig({ vignetteStyle: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      <option value="soft">Soft Vignette</option>
                      <option value="medium">Medium Vignette</option>
                      <option value="dramatic">Dramatic Vignette</option>
                    </SettingsSelect>
                  </div>
                </div>

                {/* Overlays */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallpaper Overlays</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Date & Time</h5>
                      <p className="text-xs text-slate-500">Render current local date/time in the corner.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.overlays.dateTime}
                      onChange={(e) => saveConfig({
                        overlays: { ...config.overlays, dateTime: e.target.checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Source Credits</h5>
                      <p className="text-xs text-slate-500">Render list of news sources in the bottom-right corner.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.overlays.sourceCredit}
                      onChange={(e) => saveConfig({
                        overlays: { ...config.overlays, sourceCredit: e.target.checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-white">Concepts Sampled</h5>
                      <p className="text-xs text-slate-500">Render list of source headlines in the bottom-left corner.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      checked={config.overlays.inspiringHeadlines}
                      onChange={(e) => saveConfig({
                        overlays: { ...config.overlays, inspiringHeadlines: e.target.checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
  )
}
