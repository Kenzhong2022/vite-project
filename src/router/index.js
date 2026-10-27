import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import StaticAssets from '@/views/StaticAssets.vue'
import VersionCheck from '@/views/VersionCheck.vue'
import About from '@/views/About.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
    { path: '/static-assets', name: 'static-assets', component: StaticAssets, meta: { title: '静态资源' } },
    { path: '/version-check', name: 'version-check', component: VersionCheck, meta: { title: '版本热更新' } },
    { path: '/about', name: 'about', component: About, meta: { title: '关于' } },
  ],
})

export default router
