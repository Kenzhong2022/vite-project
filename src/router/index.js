import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import StaticAssets from '@/views/StaticAssets.vue'
// sections 内嵌在页面组件里（普通 <script> 命名导出），router 从组件文件直接取
import { sections as staticAssetsSections } from '@/components/StaticAssetsDemo.vue'
import { sections as preBundleSections } from '@/views/PreBundle.vue'
import { sections as versionCheckSections } from '@/views/VersionCheck.vue'
import { sections as pluginOrderSections } from '@/views/PluginOrder.vue'
import { sections as keepAliveSections } from '@/views/KeepAliveTest.vue'
import { sections as elementThemeSections } from '@/views/ElementTheme.vue'
import { sections as composablesSections } from '@/views/ComposablesDemo.vue'
import { sections as componentOverheadSections } from '@/views/ComponentOverheadDemo.vue'
import { sections as aboutSections } from '@/views/About.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    {
      path: '/static-assets',
      name: 'static-assets',
      component: StaticAssets,
      meta: { title: '静态资源', toc: staticAssetsSections },
    },
    {
      path: '/pre-bundle',
      name: 'pre-bundle',
      component: () => import('@/views/PreBundle.vue'),
      // meta.toc 引用页面自己的章节数据（单一来源：卡片 header / strong 分点 / 目录共用）
      meta: { title: '预构建', toc: preBundleSections },
    },
    {
      path: '/version-check',
      name: 'version-check',
      component: () => import('@/views/VersionCheck.vue'),
      meta: { title: '版本热更新', toc: versionCheckSections },
    },
    {
      path: '/plugin-order',
      name: 'plugin-order',
      component: () => import('@/views/PluginOrder.vue'),
      meta: { title: '插件开发', toc: pluginOrderSections },
    },
    {
      path: '/keep-alive-test',
      name: 'keep-alive-test',
      component: () => import('@/views/KeepAliveTest.vue'),
      // meta.keepAlive: true → 该路由组件进入 keep-alive 的 include 名单
      meta: { title: 'KeepAlive 测试', keepAlive: true, toc: keepAliveSections },
    },
    {
      path: '/element-theme',
      name: 'element-theme',
      component: () => import('@/views/ElementTheme.vue'),
      meta: { title: 'Element 主题色', toc: elementThemeSections },
    },
    {
      path: '/composables',
      name: 'composables',
      component: () => import('@/views/ComposablesDemo.vue'),
      meta: { title: '组合式函数', toc: composablesSections },
    },
    {
      path: '/component-overhead',
      name: 'component-overhead',
      component: () => import('@/views/ComponentOverheadDemo.vue'),
      meta: { title: '组件开销', toc: componentOverheadSections },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About.vue'),
      meta: { title: '关于', toc: aboutSections },
    },
  ],
})

export default router
