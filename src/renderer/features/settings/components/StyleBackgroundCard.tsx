import React from 'react'
import type { MurmurConfig, ThemeName } from '@core/domain/types'
import SettingsChipGroup from '../components/SettingsChipGroup'
import { themePreviewBackgroundClass } from '../../wallpaper/wallpaperThemePreview'

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

type StyleBackgroundCardProps = {
  config: MurmurConfig
  patchDraft: (partial: Partial<MurmurConfig>) => void
}

export default function StyleBackgroundCard({ config, patchDraft }: StyleBackgroundCardProps) {
  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
      data-testid="style-section-background"
    >
      <div>
        <h3 className="text-sm font-bold text-white">Background</h3>
        <p className="text-xs text-slate-500 mt-1">Canvas theme, grain, and vignette behind the phrase.</p>
      </div>
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
