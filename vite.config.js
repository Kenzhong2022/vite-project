import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// 屏蔽 Vite 8 的警告
process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // 用 __dirname 保证 CF 能成功部署
    },
  },
})