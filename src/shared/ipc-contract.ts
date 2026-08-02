/** IPC channel names shared by main and preload (process-safe; no Node/Electron). */

export const IpcChannel = {
  configGet: 'config:get',
  configSave: 'config:save',
  configUpdated: 'config:updated',
  historyGet: 'history:get',
  historyClear: 'history:clear',
  actionRefresh: 'action:refresh',
  actionPreviewTheme: 'action:previewTheme',
  stateGet: 'state:get',
  stateUpdated: 'state:updated',
  screensGet: 'screens:get',
  e2eGenerationCountGet: 'e2e:generationCount',
  e2eGenerationCountReset: 'e2e:generationCount:reset',
  shellOpenExternal: 'shell:open-external'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]
