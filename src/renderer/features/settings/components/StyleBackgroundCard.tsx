import React from 'react'
import type { BackgroundMode, MonitorProfile, ThemeName } from '@core/domain/types'
import {
  MOOD_LINKED_BACKGROUND_PRESETS,
  STANDALONE_BACKGROUND_PRESETS,
  backgroundPresetIdFromProfile,
  backgroundTemplateVarsForPresetSelection,
  formatBackgroundUserVarLabel,
  listUserBackgroundTemplateVarsForProfile,
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
  const userTemplateVars = listUserBackgroundTemplateVarsForProfile(config)

  const onPresetChange = (id: BackgroundPresetId) => {
    patchDraft({
      backgroundPresetId: id,
      backgroundTemplateVars: backgroundTemplateVarsForPresetSelection(id, config.backgroundTemplateVars)
    })
  }

  const setUserTemplateVar = (name: string, value: string) => {
    patchDraft({
      backgroundTemplateVars: { ...(config.backgroundTemplateVars ?? {}), [name]: value }
    })
  }

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
            On each phrase refresh, Murmur fills <code className="text-slate-400">{'{{samples}}'}</code> and{' '}
            <code className="text-slate-400">{'{{phrase}}'}</code> from headlines and your phrase. Other{' '}
            <code className="text-slate-400">{'{{variables}}'}</code> are set below, then Gemini + Cloudflare FLUX paint
            the wallpaper.
          </p>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image prompt preset</label>
            <SettingsSelect
              data-testid="style-background-ai-preset-select"
              selectSize="sm"
              className="max-w-[240px]"
              value={backgroundPresetIdFromProfile(config)}
              onChange={(e) => onPresetChange(e.target.value as BackgroundPresetId)}
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

          {userTemplateVars.length > 0 && (
            <div
              className="flex flex-wrap gap-x-3 gap-y-2 p-3 rounded-lg border border-slate-800 bg-slate-950/80"
              data-testid="style-background-template-vars"
            >
              {userTemplateVars.map((name) => (
                <label key={name} className="flex flex-col min-w-[7rem] flex-1 max-w-[11rem]">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {formatBackgroundUserVarLabel(name)}
                  </span>
                  <input
                    type="text"
                    data-testid={`style-background-var-${name}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={config.backgroundTemplateVars?.[name] ?? ''}
                    placeholder={`{{${name}}}`}
                    onChange={(e) => setUserTemplateVar(name, e.target.value)}
                  />
                </label>
              ))}
            </div>
          )}

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
                  ? 'Describe the wallpaper. Use {{samples}}, {{phrase}}, or {{yourVariable}}…'
                  : undefined
              }
            />
            {isCustomPreset ? (
              <p className="text-[10px] text-slate-600 mt-1">{config.customBackgroundPrompt.length}/2048</p>
            ) : (
              <p className="text-[10px] text-slate-600 mt-1">
                {'{{samples}}'} and {'{{phrase}}'} fill on refresh; other placeholders use the fields above.
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
