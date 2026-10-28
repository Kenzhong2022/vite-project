import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import StaticAssets from '@/views/StaticAssets.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    {
      path: '/static-assets',
      name: 'static-assets',
      component: StaticAssets,
      meta: { title: '静态资源' },
    },
    {
      path: '/pre-bundle',
      name: 'pre-bundle',
      component: () => import('@/views/PreBundle.vue'),
      meta: { title: '预构建' },
    },
    {
      path: '/version-check',
      name: 'version-check',
      component: () => import('@/views/VersionCheck.vue'),
      meta: { title: '版本热更新' },
    },
    {
      path: '/plugin-order',
      name: 'plugin-order',
      component: () => import('@/views/PluginOrder.vue'),
      meta: { title: '插件开发' },
    },
    {
      path: '/keep-alive-test',
      name: 'keep-alive-test',
      component: () => import('@/views/KeepAliveTest.vue'),
      // meta.keepAlive: true → 该路由组件进入 keep-alive 的 include 名单
      meta: { title: 'KeepAlive 测试', keepAlive: true },
    },
    {
      path: '/element-theme',
      name: 'element-theme',
      component: () => import('@/views/ElementTheme.vue'),
      meta: { title: 'Element 主题色' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About.vue'),
      meta: { title: '关于' },
    },
  ],
})

export default router
