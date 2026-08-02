import tseslint from 'typescript-eslint'

/**
 * Process-boundary lint for repo-restructure (AC-4 / AC-12).
 * Style rules are deferred until after the structural migration.
 */
export default tseslint.config(
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}', 'src/preload/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/main/infrastructure/**', '**/main/bootstrap/**'],
              message:
                'Renderer/preload must not import main infrastructure or bootstrap. Use window.api / ipc-contract / core only.'
            },
            {
              group: ['@adapters/*', '@main/*', '@core/ports', '@core/ports/*'],
              message:
                'Renderer/preload must not import main infrastructure, bootstrap, or core ports. Use window.api / ipc-contract / core domain+lib only.'
            }
          ]
        }
      ]
    }
  }
)
