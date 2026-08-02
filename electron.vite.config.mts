import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const coreDomain = resolve('src/core/domain')
const corePorts = resolve('src/core/ports')
const coreLib = resolve('src/core/lib')
const mainRoot = resolve('src/main')
const ipcContract = resolve('src/shared/ipc-contract.ts')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@core/domain': coreDomain,
        '@core/ports': corePorts,
        '@core/lib': coreLib,
        '@main': mainRoot,
        '@shared/ipc': ipcContract
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@core/domain': coreDomain,
        '@core/lib': coreLib,
        '@shared/ipc': ipcContract
      }
    }
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@core/domain': coreDomain,
        '@core/lib': coreLib,
        '@shared/ipc': ipcContract
      }
    }
  }
})
