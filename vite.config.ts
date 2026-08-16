import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages はリポジトリ名のサブパス (/divination-journal/) で配信されるため、
  // ビルド成果物の資産参照を絶対パス (/assets/...) からサブパス基準にする必要がある。
  base: '/divination-journal/',
})
