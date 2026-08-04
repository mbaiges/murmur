import type { BackgroundMode, MonitorProfile, ThemeName } from '../../domain/types'

export type BackgroundPaintInput = {
  backgroundMode: BackgroundMode
  theme: ThemeName
  baseImagePath?: string
}

export function resolveBackgroundPaintInput(
  profile: MonitorProfile,
  absolutePaths: { personal?: string | null; ai?: string | null }
): BackgroundPaintInput {
  const mode = profile.backgroundMode
  if (mode === 'photo' && absolutePaths.personal) {
    return { backgroundMode: 'photo', theme: profile.theme, baseImagePath: absolutePaths.personal }
  }
  if (mode === 'ai' && absolutePaths.ai) {
    return { backgroundMode: 'ai', theme: profile.theme, baseImagePath: absolutePaths.ai }
  }
  return { backgroundMode: 'gradient', theme: profile.theme }
}
