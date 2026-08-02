import React from 'react'
import type { MurmurConfig } from '@core/domain/types'
import {
  MOOD_LINKED_PROMPT_PRESETS,
  STANDALONE_PROMPT_PRESETS,
  promptToPresetId
} from '@core/lib/presets/promptPresets'
import type { TonePreset } from '@core/domain/types'
import SettingsSelect from '../components/SettingsSelect'

type VoiceTabProps = {
  config: MurmurConfig
  patchDraft: (partial: Partial<MurmurConfig>) => void
  onPresetChange: (presetId: string) => void
}

export default function VoiceTab({ config, patchDraft, onPresetChange }: VoiceTabProps) {
  return (
    <div className="max-w-2xl space-y-8 pb-24">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Voice &amp; prompts</h2>
        <p className="text-slate-400 text-sm">
          System prompt, tone, language, and markup rules. Changes apply when you click Apply changes.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI System Prompt Preset</label>
          <SettingsSelect
            selectSize="sm"
            className="max-w-[220px]"
            value={promptToPresetId(config.systemPrompt)}
            onChange={(e) => onPresetChange(e.target.value)}
          >
            <optgroup label="Linked to moods">
              {MOOD_LINKED_PROMPT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Prompt only">
              {STANDALONE_PROMPT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </optgroup>
            <option value="Custom">Custom</option>
          </SettingsSelect>
        </div>
        <textarea
          rows={6}
          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono resize-y"
          value={config.systemPrompt}
          onChange={(e) => patchDraft({ systemPrompt: e.target.value })}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Tone &amp; language</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tone</label>
            <SettingsSelect
              value={config.tonePreset}
              onChange={(e) => {
                const tonePreset = e.target.value as MurmurConfig['tonePreset']
                patchDraft({ tonePreset })
              }}
            >
              <option value="none">No tone</option>
              <option value="neutral">Neutral</option>
              <option value="professional">Professional</option>
              <option value="villero">Villero</option>
              <option value="custom">Custom</option>
            </SettingsSelect>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output language</label>
            <SettingsSelect
              value={config.language}
              onChange={(e) => patchDraft({ language: e.target.value })}
            >
              <option value="auto">Auto (Match headlines)</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </SettingsSelect>
          </div>
        </div>
        {config.tonePreset === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Custom tone</label>
            <textarea
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
              value={config.customToneText}
              onChange={(e) => patchDraft({ customToneText: e.target.value, tonePreset: 'custom' as TonePreset })}
              placeholder="Describe how the AI should sound…"
            />
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <p className="text-xs text-slate-500">Markup changes apply when you click Apply changes.</p>
        <h3 className="text-sm font-bold text-white">Markup rules</h3>
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              ['enableBold', 'Bold', '**bold** markers'],
              ['enableItalic', 'Italic', '*italic* markers'],
              ['enableNewlines', 'Multi-line', 'Line breaks'],
              ['enableDifferentFonts', 'Mixed fonts', '[font:…] tags']
            ] as const
          ).map(([key, title, desc]) => (
            <label key={key} className="flex items-center justify-between gap-2 text-sm">
              <span>
                <span className="text-white block">{title}</span>
                <span className="text-[10px] text-slate-500">{desc}</span>
              </span>
              <input
                type="checkbox"
                className="rounded border-slate-800 text-indigo-600 h-4 w-4 bg-slate-950 shrink-0"
                checked={config[key]}
                onChange={(e) => patchDraft({ [key]: e.target.checked })}
              />
            </label>
          ))}
        </div>
      </div>

      <details className="bg-slate-900 border border-slate-800 rounded-xl p-6 group">
        <summary className="text-sm font-bold text-white cursor-pointer list-none">Advanced generation</summary>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Headline sample size</label>
          <input
            type="number"
            min={5}
            max={50}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
            value={config.headlineSampleSize}
            onChange={(e) => patchDraft({ headlineSampleSize: Number(e.target.value) })}
          />
          <p className="text-xs text-slate-500 mt-1">How many RSS headlines to sample per refresh (5–50).</p>
        </div>
      </details>
    </div>
  )
}
