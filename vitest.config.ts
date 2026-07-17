import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@domain': resolve('src/domain'),
      '@ports': resolve('src/ports'),
      '@adapters': resolve('src/adapters'),
      '@shared': resolve('src/shared')
    }
  }
})
