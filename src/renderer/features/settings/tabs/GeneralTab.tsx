import React from 'react'
import type { MurmurConfig, MurmurState } from '@core/domain/types'
import type { AppUpdateInfo } from '@shared/app-update'
import SettingsSelect from '../components/SettingsSelect'
import { useAppUpdate } from '../hooks/useAppUpdate'

type GeneralTabProps = {
  config: MurmurConfig
  state: MurmurState | null
  saveConfig: (partial: Partial<MurmurConfig>) => Promise<void>
}

function updateStatusLabel(info: AppUpdateInfo, checking: boolean): string {
  if (checking || info.phase === 'checking') {
    return 'Checking for updates…'
  }
  switch (info.phase) {
    case 'disabled':
      return 'Updates apply to installed builds only.'
    case 'downloaded':
      return `Version ${info.availableVersion ?? ''} is ready to install.`
    case 'downloading':
      return `Downloading… ${Math.round(info.downloadPercent ?? 0)}%`
    case 'available':
      return `Update ${info.availableVersion ?? ''} found; downloading…`
    case 'not-available':
      return 'You’re on the latest release.'
    case 'error':
      return info.errorMessage ?? 'Could not check for updates.'
    case 'idle':
    default:
      return 'Automatic update checks run in the background.'
  }
}

export default function GeneralTab({ config, state, saveConfig }: GeneralTabProps) {
  const { updateInfo, checkForUpdates, quitAndInstallUpdate, checking } = useAppUpdate()
  const canCheck = updateInfo?.phase !== 'disabled'
  const canRestart = updateInfo?.phase === 'downloaded'

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">General</h2>
        <p className="text-slate-400 text-sm">Connect Gemini, set refresh schedule, and control startup behavior.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Connection</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
          <input
            type="password"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none transition-all"
            value={config.geminiApiKey}
            onChange={(e) => saveConfig({ geminiApiKey: e.target.value })}
            placeholder="Enter your API Key"
          />
          <p className="text-slate-500 text-xs mt-2">
            Get a free key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              className="text-indigo-400 hover:text-indigo-300"
              onClick={(e) => {
                e.preventDefault()
                void window.api?.openExternal('https://aistudio.google.com/apikey')
              }}
            >
              Google AI Studio
            </a>
            .
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Schedule</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Refresh Interval</label>
          <SettingsSelect
            value={config.refreshIntervalMinutes}
            onChange={(e) => saveConfig({ refreshIntervalMinutes: Number(e.target.value) })}
          >
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
            <option value={180}>Every 3 hours</option>
            <option value={360}>Every 6 hours</option>
            <option value={720}>Every 12 hours</option>
            <option value={1440}>Every 24 hours</option>
          </SettingsSelect>
          <p className="text-xs text-slate-500 mt-2">Applies to the next scheduled refresh after you save.</p>
        </div>
        <p className="text-xs text-slate-500">
          Last update:{' '}
          <span className="text-slate-400">{state?.lastRefreshTime ?? 'Idle'}</span>
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4" data-testid="app-update-section">
        <h3 className="text-sm font-bold text-white">App updates</h3>
        <p className="text-xs text-slate-500">
          Version{' '}
          <span className="text-slate-300 font-medium" data-testid="app-update-version">
            {updateInfo?.currentVersion ?? '…'}
          </span>
        </p>
        {updateInfo ? (
          <p className="text-xs text-slate-400" data-testid="app-update-status">
            {updateStatusLabel(updateInfo, checking)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {canRestart ? (
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              onClick={() => void quitAndInstallUpdate()}
            >
              Restart to update
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canCheck || checking}
            data-testid="app-update-check-btn"
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            onClick={() => void checkForUpdates()}
          >
            Check for updates
          </button>
          <button
            type="button"
            className="text-xs text-indigo-400 hover:text-indigo-300"
            onClick={() => {
              const url = updateInfo?.releasesUrl ?? 'https://github.com/mbaiges/murmur/releases'
              void window.api?.openExternal(url)
            }}
          >
            Manual download
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Launch at login</h4>
            <p className="text-xs text-slate-500">Run Murmur in the tray when you sign in.</p>
          </div>
          <input
            type="checkbox"
            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
            checked={config.launchAtLogin}
            onChange={(e) => saveConfig({ launchAtLogin: e.target.checked })}
          />
        </div>
      </div>
    </div>
  )
}
