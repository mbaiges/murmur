import { useCallback, useEffect, useState } from 'react'
import type { AppUpdateInfo } from '@shared/app-update'
import { getWindowApi } from './getWindowApi'

export function useAppUpdate(): {
  updateInfo: AppUpdateInfo | null
  checkForUpdates: () => Promise<void>
  quitAndInstallUpdate: () => Promise<void>
  checking: boolean
} {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const api = getWindowApi()
    if (!api?.getUpdateInfo) {
      return
    }
    void api.getUpdateInfo().then(setUpdateInfo)
    const unsubscribe = api.onUpdateStatus?.((info) => {
      setUpdateInfo(info)
      setChecking(false)
    })
    return unsubscribe
  }, [])

  const checkForUpdates = useCallback(async () => {
    const api = getWindowApi()
    if (!api?.checkForUpdates) {
      return
    }
    setChecking(true)
    try {
      const info = await api.checkForUpdates()
      setUpdateInfo(info)
    } finally {
      setChecking(false)
    }
  }, [])

  const quitAndInstallUpdate = useCallback(async () => {
    const api = getWindowApi()
    if (!api?.quitAndInstallUpdate) {
      return
    }
    await api.quitAndInstallUpdate()
  }, [])

  return { updateInfo, checkForUpdates, quitAndInstallUpdate, checking }
}
