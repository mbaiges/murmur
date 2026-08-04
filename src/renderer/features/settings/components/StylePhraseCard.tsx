import React from 'react'
import type { MonitorProfile } from '@core/domain/types'
import SettingsSelect from './SettingsSelect'
import SettingsChipGroup from './SettingsChipGroup'
import {
  AI_PHRASE_IN_IMAGE_PRESETS,
  getAiPhraseDeliveryMode,
  patchForAiPhraseDeliveryMode,
  shouldPaintPhraseOverlay
} from '@core/lib/presets/aiPhraseInImagePresets'

type StylePhraseCardProps = {
  config: MonitorProfile
  patchDraft: (partial: Partial<MonitorProfile>) => void
}

function aiDeliveryHint(mode: ReturnType<typeof getAiPhraseDeliveryMode>): string {
  switch (mode) {
    case 'in-image':
      return 'FLUX renders the phrase in the wallpaper. Murmur does not draw the center headline.'
    case 'hidden':
      return 'No Murmur phrase on the wallpaper — AI image only. Turn on Widgets → Phrase caption for text at the bottom.'
    case 'overlay':
      return 'Murmur draws the center headline on top of the AI image (no phrase text in the FLUX prompt).'
  }
}

export default function StylePhraseCard({ config, patchDraft }: StylePhraseCardProps) {
  const overlayPhrase = shouldPaintPhraseOverlay(config)
  const aiDelivery = getAiPhraseDeliveryMode(config)
  const isAiBackground = config.backgroundMode === 'ai'

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
      data-testid="style-section-phrase"
    >
      <div>
        <h3 className="text-sm font-bold text-white">Phrase</h3>
        <p className="text-xs text-slate-500 mt-1">Where and how the headline appears on the wallpaper.</p>
      </div>

      {isAiBackground ? (
        <div className="space-y-4" data-testid="style-ai-integrated-phrase">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Phrase on wallpaper (AI background)
            </h4>
            <SettingsChipGroup
              aria-label="Phrase on wallpaper for AI background"
              value={aiDelivery}
              onChange={(mode) => patchDraft(patchForAiPhraseDeliveryMode(mode))}
              options={[
                { value: 'overlay', label: 'Murmur overlay', testId: 'style-ai-phrase-overlay' },
                {
                  value: 'in-image',
                  label: 'Inside AI image',
                  testId: 'style-ai-phrase-in-image-toggle'
                },
                { value: 'hidden', label: 'Hidden', testId: 'style-ai-phrase-hidden' }
              ]}
            />
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{aiDeliveryHint(aiDelivery)}</p>
          </div>
          {config.aiPhraseInImage && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                In-image phrase style
              </label>
              <SettingsChipGroup
                aria-label="In-image phrase preset"
                value={config.aiPhraseInImagePreset}
                onChange={(aiPhraseInImagePreset) => patchDraft({ aiPhraseInImagePreset })}
                options={AI_PHRASE_IN_IMAGE_PRESETS.map((p) => ({
                  value: p.value,
                  label: p.label,
                  testId: `style-ai-phrase-preset-${p.value}`
                }))}
              />
              <p className="text-[10px] text-slate-500 mt-2">
                {
                  AI_PHRASE_IN_IMAGE_PRESETS.find((p) => p.value === config.aiPhraseInImagePreset)
                    ?.description
                }
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div>
            <h4 className="text-sm font-medium text-white">Center headline</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Off hides the large phrase; use Widgets → Phrase caption for a bottom line.
            </p>
          </div>
          <input
            type="checkbox"
            data-testid="style-show-hero-phrase"
            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
            checked={config.showHeroPhrase}
            onChange={(e) => patchDraft({ showHeroPhrase: e.target.checked })}
          />
        </div>
      )}

      <div className={`space-y-6 border-t border-slate-800 pt-4 ${!overlayPhrase ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Overlay typography</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Font</label>
            <SettingsSelect
              value={config.fontFamily}
              onChange={(e) => patchDraft({ fontFamily: e.target.value as MonitorProfile['fontFamily'] })}
            >
              <option value="EB Garamond">EB Garamond (Elegant Serif)</option>
              <option value="Garamond Bold">Garamond Bold (Extra Heavy Editorial)</option>
              <option value="Playfair Display">Playfair Display (Poetic Serif)</option>
              <option value="Outfit">Outfit (Clean Sans-Serif)</option>
              <option value="Monospace">Monospace (Terminal Code)</option>
            </SettingsSelect>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Alignment
            </label>
            <SettingsChipGroup
              aria-label="Text alignment"
              value={config.textAlignment}
              onChange={(textAlignment) => patchDraft({ textAlignment })}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' }
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Layout style
          </label>
          <SettingsSelect
            data-testid="style-layout-select"
            value={config.layoutStyle}
            onChange={(e) => patchDraft({ layoutStyle: e.target.value as MonitorProfile['layoutStyle'] })}
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
            Applies when Murmur draws the center headline (overlay mode).
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motion</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Animation
              </label>
              <SettingsChipGroup
                aria-label="Transition animation"
                value={config.animation}
                onChange={(animation) => patchDraft({ animation })}
                options={[
                  { value: 'Fade', label: 'Fade' },
                  { value: 'DriftIn', label: 'Drift' },
                  { value: 'Morph', label: 'Morph' },
                  { value: 'Typewriter', label: 'Type' },
                  { value: 'Glitch', label: 'Glitch' },
                  { value: 'Instant', label: 'Instant' }
                ]}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <h5 className="text-sm font-medium text-white">Keyboard audio</h5>
                <p className="text-xs text-slate-500">Typewriter sounds.</p>
              </div>
              <input
                type="checkbox"
                disabled={config.animation !== 'Typewriter'}
                className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950 disabled:opacity-50"
                checked={config.audioFeedback}
                onChange={(e) => patchDraft({ audioFeedback: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
