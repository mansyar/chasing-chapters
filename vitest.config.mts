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
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/vitest.setup.ts',
        '**/register-css-loader.mjs',
        'src/payload-types.ts', // Generated file
        'src/payload.config.ts', // Configuration file
        'src/app/**/layout.tsx', // Next.js layouts are hard to test meaningfully
        'src/app/**/page.tsx', // Next.js pages are tested via E2E
        'src/app/sitemap.ts',
        'src/app/robots.ts',
      ],
      include: [
        'src/components/**/*',
        'src/lib/**/*',
        'src/collections/**/*',
        'src/app/(payload)/api/**/*',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 55,
          lines: 35,
          statements: 35,
        },
        // Well-tested components with higher coverage
        'src/components/ColorPicker/**/*': {
          branches: 90,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'src/components/TagManager/**/*': {
          branches: 85,
          functions: 80,
          lines: 90,
          statements: 90,
        },
        // Library functions that are tested
        'src/lib/google-books.ts': {
          branches: 75,
          functions: 100,
          lines: 90,
          statements: 90,
        },
        'src/lib/search-cache.ts': {
          branches: 85,
          functions: 40,
          lines: 65,
          statements: 65,
        },
        'src/lib/search-highlight.ts': {
          branches: 65,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  define: {
    'import.meta.vitest': undefined,
  },
})
