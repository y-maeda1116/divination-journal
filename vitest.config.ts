import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // .tsx のコンポーネントテストは DOM が必要なため jsdom で実行する。
    // 純ロジックの .test.ts も同じ環境で問題ない。
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/main.tsx', 'node_modules/'],
    },
  },
});
