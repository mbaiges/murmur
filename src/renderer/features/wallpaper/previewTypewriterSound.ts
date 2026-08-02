import { playTypewriterBlip } from './typewriterBlipSound'

/** Settings mini preview — slightly quieter than live wallpaper. */
export function playPreviewTypewriterBlip(): void {
  playTypewriterBlip(0.035)
}
