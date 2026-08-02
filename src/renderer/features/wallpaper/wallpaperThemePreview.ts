import type { ThemeName } from '@core/domain/types'

/** Static wallpaper background classes for previews (no animation). */
export function themePreviewBackgroundClass(theme: ThemeName): string {
  switch (theme) {
    case 'Midnight':
      return 'bg-midnight-gradient'
    case 'Drift':
      return 'bg-drift-gradient'
    case 'Forest':
      return 'bg-forest-gradient'
    case 'Crimson':
      return 'bg-crimson-gradient'
    case 'Cyberpunk':
      return 'bg-cyberpunk-gradient'
    case 'WarmGlow':
      return 'bg-warmglow-gradient'
    case 'Parchment':
      return 'bg-[#f4efe2]'
    case 'Blanc':
      return 'bg-[#f8f9fa]'
    default:
      return 'bg-midnight-gradient'
  }
}

export function themePreviewIsDark(theme: ThemeName): boolean {
  return ['Midnight', 'Drift', 'Forest', 'Crimson', 'Cyberpunk', 'WarmGlow'].includes(theme)
}

export function fontFamilyPreviewClass(fontFamily: string): string {
  switch (fontFamily) {
    case 'EB Garamond':
      return 'font-eb-garamond'
    case 'Garamond Bold':
      return 'font-garamond-bold'
    case 'Playfair Display':
      return 'font-playfair'
    case 'Outfit':
      return 'font-outfit'
    case 'Monospace':
      return 'font-monospace'
    default:
      return 'font-eb-garamond'
  }
}
