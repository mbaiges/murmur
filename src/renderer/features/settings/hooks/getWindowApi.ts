import type { MurmurWindowApi } from '../../types/window-api'

export function getWindowApi(): MurmurWindowApi | undefined {
  return window.api
}
