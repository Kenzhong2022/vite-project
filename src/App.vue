<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { Promotion, HomeFilled, Files, Lightning, RefreshRight, InfoFilled } from '@element-plus/icons-vue'

const POLL_INTERVAL = 5
const remaining = ref(POLL_INTERVAL)
const expanded = ref(false)

const envInfo = computed(() => ({
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  SSR: import.meta.env.SSR,
}))

const isProd = import.meta.env.PROD

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
        <el-icon class="app-logo-icon"><Promotion /></el-icon>
        Vite Demo
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
        <router-link to="/about" class="nav-link" active-class="nav-link-active">
          <el-icon><InfoFilled /></el-icon><span>关于</span>
        </router-link>
      </nav>
    </div>
  </header>

  <main class="app-main">
    <router-view />
  </main>

  <div class="env-panel" :class="{ expanded }" @click="expanded = !expanded">
    <div v-if="!expanded" class="env-panel-collapsed">
      <el-tag :type="isProd ? 'warning' : 'success'" size="small" effect="plain">
        {{ isProd ? 'PROD' : 'DEV' }}
      </el-tag>
      <span v-if="isProd" class="env-panel-tick">{{ remaining }}s</span>
      <span v-else class="env-panel-hint">展开</span>
    </div>

    <div v-else class="env-panel-expanded" @click.stop>
      <div class="env-panel-header">
        <span>环境信息</span>
        <el-button link size="small" @click="expanded = false">收起</el-button>
      </div>
      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="MODE">{{ envInfo.MODE }}</el-descriptions-item>
        <el-descriptions-item label="BASE_URL">{{ envInfo.BASE_URL }}</el-descriptions-item>
        <el-descriptions-item label="PROD">{{ envInfo.PROD }}</el-descriptions-item>
        <el-descriptions-item label="DEV">{{ envInfo.DEV }}</el-descriptions-item>
        <el-descriptions-item label="SSR">{{ envInfo.SSR }}</el-descriptions-item>
        <el-descriptions-item v-if="isProd" label="下一次检查">{{ remaining }}s</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
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
  transition: color 0.15s, background 0.15s;
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

.env-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  cursor: pointer;
  user-select: none;
}

.env-panel-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.env-panel-tick {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
}

.env-panel-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.env-panel-expanded {
  width: 260px;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow);
  overflow: hidden;
}

.env-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  font-weight: 500;
}
</style>
