import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 使用 import.meta.dirname 替代 __dirname (Vite 8 推荐写法)
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
})