import React from 'react'
import type { BackgroundMode, MonitorProfile, ThemeName } from '@core/domain/types'
import {
  MOOD_LINKED_BACKGROUND_PRESETS,
  STANDALONE_BACKGROUND_PRESETS,
  backgroundPresetIdFromProfile,
  resolveBackgroundTemplateSource,
  type BackgroundPresetId
} from '@core/lib/presets/backgroundPromptPresets'
import SettingsChipGroup from '../components/SettingsChipGroup'
import SettingsSelect from '../components/SettingsSelect'
import { themePreviewBackgroundClass } from '../../wallpaper/wallpaperThemePreview'
import { getWindowApi } from '../hooks/getWindowApi'

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'Midnight', label: 'Midnight' },
  { value: 'Drift', label: 'Drift' },
  { value: 'Forest', label: 'Forest' },
  { value: 'Crimson', label: 'Crimson' },
  { value: 'Cyberpunk', label: 'Cyberpunk' },
  { value: 'WarmGlow', label: 'Warm Glow' },
  { value: 'Parchment', label: 'Parchment' },
  { value: 'Blanc', label: 'Blanc' }
]

const BACKGROUND_MODES: { value: BackgroundMode; label: string; testId: string }[] = [
  { value: 'gradient', label: 'Gradient', testId: 'style-background-mode-gradient' },
  { value: 'photo', label: 'Photo', testId: 'style-background-mode-photo' },
  { value: 'ai', label: 'AI image', testId: 'style-background-mode-ai' }
]

type StyleBackgroundCardProps = {
  config: MonitorProfile
  patchDraft: (partial: Partial<MonitorProfile>) => void
  pendingPhotoSourcePath: string | null
  setPendingPhotoSourcePath: (path: string | null) => void
}

export default function StyleBackgroundCard({
  config,
  patchDraft,
  pendingPhotoSourcePath,
  setPendingPhotoSourcePath
}: StyleBackgroundCardProps) {
  const onPickPhoto = async () => {
    const api = getWindowApi()
    if (!api?.pickBackgroundPhoto) return
    const path = await api.pickBackgroundPhoto()
    if (path) {
      setPendingPhotoSourcePath(path)
      patchDraft({ backgroundMode: 'photo' })
    }
  }

  const isCustomPreset = config.backgroundPresetId === 'Custom'
  const promptPreview = isCustomPreset
    ? config.customBackgroundPrompt
    : resolveBackgroundTemplateSource(config)

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
      data-testid="style-section-background"
    >
      <div>
        <h3 className="text-sm font-bold text-white">Background</h3>
        <p className="text-xs text-slate-500 mt-1">Gradient themes, a personal photo, or AI-generated art behind the phrase.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mode</label>
        <SettingsChipGroup
          aria-label="Background mode"
          value={config.backgroundMode}
          onChange={(backgroundMode) => patchDraft({ backgroundMode })}
          options={BACKGROUND_MODES.map((m) => ({
            value: m.value,
            label: m.label,
            testId: m.testId
          }))}
        />
      </div>

      {config.backgroundMode === 'gradient' && (
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Theme</label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {THEMES.map((t) => {
              const active = config.theme === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  title={t.label}
                  onClick={() => patchDraft({ theme: t.value })}
                  className={`relative h-12 rounded-lg border-2 overflow-hidden ${themePreviewBackgroundClass(t.value)} ${
                    active ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className="sr-only">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {config.backgroundMode === 'photo' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">PNG or JPEG only. Click Apply to import and set the desktop background.</p>
          <button
            type="button"
            data-testid="style-background-pick-photo"
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            onClick={() => void onPickPhoto()}
          >
            Choose photo…
          </button>
          {(pendingPhotoSourcePath || config.backgroundPhotoRelPath) && (
            <p className="text-xs text-slate-400 truncate" data-testid="style-background-photo-status">
              {pendingPhotoSourcePath ? `Pending: ${pendingPhotoSourcePath.split(/[/\\]/).pop()}` : 'Photo saved for this display'}
            </p>
          )}
        </div>
      )}

      {config.backgroundMode === 'ai' && (
        <div className="space-y-4" data-testid="style-background-ai-panel">
          <p className="text-xs text-slate-500">
            On each phrase refresh, Murmur sends the preset below (with <code className="text-slate-400">{'{{samples}}'}</code>{' '}
            and/or <code className="text-slate-400">{'{{phrase}}'}</code> when the preset uses them)             through the same text model as phrase generation, then Cloudflare FLUX paints the wallpaper.
          </p>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image prompt preset</label>
            <SettingsSelect
              data-testid="style-background-ai-preset-select"
              selectSize="sm"
              className="max-w-[240px]"
              value={backgroundPresetIdFromProfile(config)}
              onChange={(e) => {
                const id = e.target.value as BackgroundPresetId
                patchDraft({ backgroundPresetId: id })
              }}
            >
              <optgroup label="Standalone">
                {STANDALONE_BACKGROUND_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Linked to moods">
                {MOOD_LINKED_BACKGROUND_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </optgroup>
              <option value="Custom">Custom</option>
            </SettingsSelect>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {isCustomPreset ? 'Custom template' : 'Preset template'}
            </label>
            <textarea
              data-testid="style-background-prompt-template"
              readOnly={!isCustomPreset}
              className={`w-full min-h-[120px] bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono outline-none transition-all resize-y ${
                isCustomPreset ? '' : 'opacity-90 cursor-default'
              }`}
              value={promptPreview}
              maxLength={2048}
              onChange={(e) =>
                isCustomPreset ? patchDraft({ customBackgroundPrompt: e.target.value }) : undefined
              }
              placeholder={
                isCustomPreset
                  ? 'Describe the wallpaper. Use {{samples}} and/or {{phrase}} where helpful…'
                  : undefined
              }
            />
            {isCustomPreset ? (
              <p className="text-[10px] text-slate-600 mt-1">{config.customBackgroundPrompt.length}/2048</p>
            ) : (
              <p className="text-[10px] text-slate-600 mt-1">
                Variables in this preset are filled on refresh; choose Custom to edit.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Grain</label>
          <SettingsChipGroup
            aria-label="Grain intensity"
            value={config.noiseIntensity}
            onChange={(noiseIntensity) => patchDraft({ noiseIntensity })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'subtle', label: 'Subtle' },
              { value: 'heavy', label: 'Heavy' }
            ]}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vignette</label>
          <SettingsChipGroup
            aria-label="Vignette style"
            value={config.vignetteStyle}
            onChange={(vignetteStyle) => patchDraft({ vignetteStyle })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'soft', label: 'Soft' },
              { value: 'medium', label: 'Medium' },
              { value: 'dramatic', label: 'Dramatic' }
            ]}
          />
        </div>
      </div>
    </section>
  )
}
