import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@domain': resolve('src/domain'),
        '@ports': resolve('src/ports'),
        '@adapters': resolve('src/adapters'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@domain': resolve('src/domain'),
        '@ports': resolve('src/ports'),
        '@adapters': resolve('src/adapters'),
        '@shared': resolve('src/shared')
      }
    }
  }
})
