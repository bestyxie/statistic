import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/hooks/**', 'src/components/ui/**'],
      exclude: [
        'src/**/*.test.*',
        // 各 hook 测试逐步补齐，先只统计已测文件，避免长期红灯（见 docs/testing-standards.md）
        'src/hooks/use*.ts',
        '!src/hooks/useScrollLock.ts',
      ],
    },
  },
})
