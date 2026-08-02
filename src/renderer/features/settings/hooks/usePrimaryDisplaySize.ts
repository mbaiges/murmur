import { useEffect, useState } from 'react'
import { getWindowApi } from './getWindowApi'

const DEFAULT = { width: 16, height: 9 }

export function usePrimaryDisplaySize() {
  const [size, setSize] = useState(DEFAULT)

  useEffect(() => {
    const api = getWindowApi()
    if (!api?.getScreens) return
    void api.getScreens().then((screens) => {
      const primary = screens[0]
      if (primary && primary.width > 0 && primary.height > 0) {
        setSize({ width: primary.width, height: primary.height })
      }
    })
  }, [])

  return size
}
