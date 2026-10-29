import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'node:path'
import vueRouteNamePlugin from './plugins/vue-route-name.js'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// 项目根目录，ESM 下等价于 __dirname
const rootDir = import.meta.dirname

export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需导入：AutoImport 负责 ElMessage 等 API，Components 负责 <el-*> 组件及其样式
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: false, // 项目不使用 TS，关闭 .d.ts 生成
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: false,
    }),
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
