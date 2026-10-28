<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Promotion,
  HomeFilled,
  Files,
  Lightning,
  Timer,
  Sort,
  RefreshRight,
  Brush,
  InfoFilled,
} from '@element-plus/icons-vue'
import EnvPanel from '@/components/EnvPanel.vue'

const POLL_INTERVAL = 5
const remaining = ref(POLL_INTERVAL)

const isProd = import.meta.env.PROD

// keep-alive 的 include 名单由路由表决定：
// 凡是路由 meta.keepAlive === true 的路由，其 name（与组件注入的 name 一致）进入缓存名单
const router = useRouter()
const keepAliveIncludes = router
  .getRoutes()
  .filter((r) => r.meta.keepAlive)
  .map((r) => r.name)

let pollTimer = null
let countdownTimer = null
let currentVersion = null

async function checkVersion() {
  if (!isProd) return

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`)
    const data = await res.json()
    const newVersion = data.version

    if (!currentVersion) {
      currentVersion = newVersion
    } else if (currentVersion !== newVersion) {
      if (confirm('发现新版本，页面内容已更新。是否立即刷新加载最新功能？')) {
        window.location.reload()
      }
    }
  } catch (e) {
    console.warn('版本检查失败:', e)
  }
}

onMounted(() => {
  if (!isProd) return

  checkVersion()

  countdownTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      remaining.value = POLL_INTERVAL
    }
  }, 1000)

  pollTimer = setInterval(checkVersion, POLL_INTERVAL * 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <header class="app-header">
    <div class="app-header-inner">
      <div class="app-logo">
        <div class="app-logo-icon"><img src="/favicon.svg" /></div>
        Vite
      </div>
      <nav class="app-nav">
        <router-link to="/" class="nav-link" exact-active-class="nav-link-active">
          <el-icon><HomeFilled /></el-icon><span>首页</span>
        </router-link>
        <router-link to="/static-assets" class="nav-link" active-class="nav-link-active">
          <el-icon><Files /></el-icon><span>静态资源</span>
        </router-link>
        <router-link to="/pre-bundle" class="nav-link" active-class="nav-link-active">
          <el-icon><Lightning /></el-icon><span>预构建</span>
        </router-link>
        <router-link to="/version-check" class="nav-link" active-class="nav-link-active">
          <el-icon><RefreshRight /></el-icon><span>版本热更新</span>
        </router-link>
        <router-link to="/plugin-order" class="nav-link" active-class="nav-link-active">
          <el-icon><Sort /></el-icon><span>插件开发</span>
        </router-link>
        <router-link to="/keep-alive-test" class="nav-link" active-class="nav-link-active">
          <el-icon><Timer /></el-icon><span>KeepAlive</span>
        </router-link>
        <router-link to="/element-theme" class="nav-link" active-class="nav-link-active">
          <el-icon><Brush /></el-icon><span>主题色</span>
        </router-link>
        <router-link to="/about" class="nav-link" active-class="nav-link-active">
          <el-icon><InfoFilled /></el-icon><span>关于</span>
        </router-link>
      </nav>
    </div>
  </header>

  <main class="app-main">
    <router-view v-slot="{ Component }">
      <keep-alive :include="keepAliveIncludes">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </main>

  <EnvPanel :remaining="remaining" />
</template>

<style>
.app-header {
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 52px;
}

.app-logo {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-logo-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.app-nav {
  display: flex;
  gap: 2px;
}

.nav-link {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  border-radius: 6px;
  transition:
    color 0.15s,
    background 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.nav-link-active {
  color: var(--el-color-primary) !important;
  background: var(--el-color-primary-light-9);
  font-weight: 500;
}

.app-main {
  min-height: calc(100vh - 52px);
  padding: 24px 0;
}
</style>
