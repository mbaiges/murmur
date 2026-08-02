import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@core/domain': resolve('src/core/domain'),
        '@core/ports': resolve('src/core/ports'),
        '@core/lib': resolve('src/core/lib'),
        '@adapters': resolve('src/main/infrastructure'),
        '@shared/ipc': resolve('src/shared/ipc-contract.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@core/domain': resolve('src/core/domain')
      }
    }
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@core/domain': resolve('src/core/domain'),
        '@core/lib': resolve('src/core/lib')
      }
    }
  }
})
