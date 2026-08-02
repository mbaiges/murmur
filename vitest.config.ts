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
      '@core/domain': resolve('src/core/domain'),
      '@core/ports': resolve('src/core/ports'),
      '@core/lib': resolve('src/core/lib'),
      '@adapters': resolve('src/adapters')
    }
  }
})
