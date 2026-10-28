import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'node:path'
import vueRouteNamePlugin from './plugins/vue-route-name.js'

// 项目根目录，ESM 下等价于 __dirname
const rootDir = import.meta.dirname

export default defineConfig({
  plugins: [
    vue(),
    vueRouteNamePlugin({
      routesFile: path.resolve(rootDir, 'src/router/index.js'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
})
