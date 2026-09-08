import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/**',
        // 各 hook 测试逐步补齐，先只统计已测文件，避免长期红灯（见 docs/testing-standards.md）
        'src/hooks/useScrollLock.ts',
        'src/components/ui/**',
      ],
      exclude: ['src/**/*.test.*'],
    },
  },
})
