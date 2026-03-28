import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/__tests__/**/*.test.ts',
      'src/__tests__/**/*.test.tsx',
      'apps/api/src/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/lib/**',
        'src/components/**',
        'apps/api/src/lib/**',
        'apps/api/src/middleware/**',
        'apps/api/src/routes/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
