import React from 'react'
import type { MonitorProfile } from '@core/domain/types'
import SyncIconChip from '../components/SyncIconChip'
import {
  MOOD_LINKED_PROMPT_PRESETS,
  STANDALONE_PROMPT_PRESETS,
  promptToPresetId
} from '@core/lib/presets/promptPresets'
import type { TonePreset } from '@core/domain/types'
import SettingsSelect from '../components/SettingsSelect'
import SettingsChipGroup from '../components/SettingsChipGroup'
import MarkupRulesChips from '../components/MarkupRulesChips'
import { OUTPUT_LANGUAGE_OPTIONS } from '../constants/outputLanguages'

type VoiceTabProps = {
  config: MonitorProfile
  syncVoice: boolean
  onSyncToggle: () => void
  patchDraft: (partial: Partial<MonitorProfile>) => void
  onPresetChange: (presetId: string) => void
  showSyncChip?: boolean
}

export default function VoiceTab({
  config,
  syncVoice,
  onSyncToggle,
  patchDraft,
  onPresetChange,
  showSyncChip = false
}: VoiceTabProps) {
  return (
    <div className="w-full max-w-5xl space-y-8 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Voice &amp; prompts</h2>
          <p className="text-slate-400 text-sm">
            System prompt, tone, language, and markup rules. Changes apply when you click Apply changes.
          </p>
        </div>
        {showSyncChip && (
          <SyncIconChip
            data-testid="settings-sync-tab-voice"
            active={syncVoice}
            onToggle={onSyncToggle}
            aria-label="Sync voice and prompts with other synced displays"
            title="Sync voice and prompts with other synced displays"
          />
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">System prompt</h3>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preset</label>
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
            <SettingsChipGroup
              aria-label="Tone preset"
              value={config.tonePreset}
              onChange={(tonePreset) => patchDraft({ tonePreset })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'professional', label: 'Pro' },
                { value: 'turro', label: 'Turro' },
                { value: 'custom', label: 'Custom' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output language</label>
            <SettingsSelect
              value={config.language}
              onChange={(e) => patchDraft({ language: e.target.value })}
            >
              {OUTPUT_LANGUAGE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
        <h3 className="text-sm font-bold text-white">Markup rules</h3>
        <MarkupRulesChips config={config} patchDraft={patchDraft} />
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
