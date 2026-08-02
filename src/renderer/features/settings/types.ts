export type SettingsTab = 'general' | 'news' | 'voice' | 'style' | 'history'

export type SettingsUiState = {
  activeTab: SettingsTab
  scrollByTab: Partial<Record<SettingsTab, number>>
  stylePreviewVisible?: boolean
  selectedMonitorId?: string
}

export type ToastState = { message: string; type: 'success' | 'error' } | null
