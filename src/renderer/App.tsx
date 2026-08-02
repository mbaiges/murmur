import React from 'react'
import WallpaperView from './features/wallpaper/WallpaperView'
import SettingsShell from './features/settings/SettingsShell'

export default function App() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('view') === 'wallpaper') {
    return <WallpaperView />
  }

  return <SettingsShell />
}
