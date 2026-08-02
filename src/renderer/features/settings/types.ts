export type SettingsTab = 'general' | 'news' | 'voice' | 'style' | 'displays'

export type DisplaysSection = 'monitors' | 'history'

export type SettingsUiState = {
  activeTab: SettingsTab
  displaysSection: DisplaysSection
  scrollByTab: Partial<Record<SettingsTab, number>>
}

export type ToastState = { message: string; type: 'success' | 'error' } | null
