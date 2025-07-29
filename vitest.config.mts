import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@payload-config': path.resolve(__dirname, './src/payload.config.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--import', './register-css-loader.mjs'],
      },
    },
    globals: true,
    silent: false,
    logLevel: 'error',
  },
  define: {
    'import.meta.vitest': undefined,
  },
})
