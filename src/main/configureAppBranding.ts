import { app, nativeImage } from 'electron'
import { resolveDockIconPath } from './lib/resolveBrandIcon'

export function configureAppBranding(): void {
  if (process.platform !== 'darwin') {
    return
  }

  try {
    app.setName('Murmur')
    app.setAboutPanelOptions({
      applicationName: 'Murmur',
      applicationVersion: app.getVersion()
    })
    const icon = nativeImage.createFromPath(resolveDockIconPath())
    if (!icon.isEmpty()) {
      app.dock?.setIcon(icon)
    }
  } catch (err) {
    console.warn('configureAppBranding: could not set Murmur dock branding', err)
  }
}
