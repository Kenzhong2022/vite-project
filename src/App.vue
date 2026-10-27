<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { Promotion, HomeFilled, Files, RefreshRight, InfoFilled } from '@element-plus/icons-vue'

const POLL_INTERVAL = 5 // 秒
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
  <!-- 头部导航 Tab -->
  <header class="app-header">
    <div class="app-header-inner">
      <div class="app-logo">
        <el-icon class="app-logo-icon"><Promotion /></el-icon>
        Vite Demo
      </div>
      <nav class="app-nav">
        <router-link to="/" class="nav-link" exact-active-class="nav-link-active">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/static-assets" class="nav-link" active-class="nav-link-active">
          <el-icon><Files /></el-icon>
          <span>静态资源</span>
        </router-link>
        <router-link to="/version-check" class="nav-link" active-class="nav-link-active">
          <el-icon><RefreshRight /></el-icon>
          <span>版本热更新</span>
        </router-link>
        <router-link to="/about" class="nav-link" active-class="nav-link-active">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </router-link>
      </nav>
    </div>
  </header>

  <!-- 页面内容 -->
  <main class="app-main">
    <router-view />
  </main>

  <!-- 环境信息 + 版本检查 悬浮窗 -->
  <div class="env-panel" :class="{ expanded }" @click="expanded = !expanded">
    <!-- 折叠视图：简洁状态 -->
    <div v-if="!expanded" class="env-panel-collapsed">
      <span class="env-panel-badge" :class="{ prod: isProd, dev: !isProd }">
        {{ isProd ? 'PROD' : 'DEV' }}
      </span>
      <span v-if="isProd" class="env-panel-tick">{{ remaining }}s</span>
      <span v-else class="env-panel-hint">点击展开</span>
    </div>

    <!-- 展开视图：完整 env 信息 -->
    <div v-else class="env-panel-expanded" @click.stop>
      <div class="env-panel-header">
        <span>Vite Env</span>
        <button class="env-panel-close" @click="expanded = false">×</button>
      </div>
      <div class="env-rows">
        <div class="env-row">
          <span class="env-key">MODE</span>
          <span class="env-val">{{ envInfo.MODE }}</span>
        </div>
        <div class="env-row">
          <span class="env-key">BASE_URL</span>
          <span class="env-val env-val-code">{{ envInfo.BASE_URL }}</span>
        </div>
        <div class="env-row">
          <span class="env-key">PROD</span>
          <span class="env-val" :class="envInfo.PROD ? 'bool-true' : 'bool-false'">{{ envInfo.PROD }}</span>
        </div>
        <div class="env-row">
          <span class="env-key">DEV</span>
          <span class="env-val" :class="envInfo.DEV ? 'bool-true' : 'bool-false'">{{ envInfo.DEV }}</span>
        </div>
        <div class="env-row">
          <span class="env-key">SSR</span>
          <span class="env-val" :class="envInfo.SSR ? 'bool-true' : 'bool-false'">{{ envInfo.SSR }}</span>
        </div>
        <div v-if="isProd" class="env-divider"></div>
        <div v-if="isProd" class="env-row">
          <span class="env-key">下一次检查</span>
          <span class="env-val env-val-tick">{{ remaining }}s</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ========== 全局布局 ========== */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 15, 22, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.app-header-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
}

.app-logo {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-logo-icon {
  font-size: 18px;
  color: #7ee787;
}

.app-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  font-size: 13px;
  color: #999;
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link:hover {
  color: #ddd;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link-active {
  color: #7ee787 !important;
  background: rgba(126, 231, 135, 0.1);
  font-weight: 500;
}

.app-main {
  min-height: calc(100vh - 56px);
  padding: 24px 0;
}

/* ========== 悬浮窗 ========== */
.env-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  user-select: none;
}

.env-panel-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 14px;
  min-width: 72px;
  background: rgba(30, 30, 40, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  color: #fff;
  transition: opacity 0.25s ease;
}

.env-panel:hover .env-panel-collapsed {
  opacity: 0.85;
}

.env-panel-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.env-panel-badge.prod {
  background: rgba(255, 180, 80, 0.2);
  color: #ffb450;
}

.env-panel-badge.dev {
  background: rgba(126, 231, 135, 0.2);
  color: #7ee787;
}

.env-panel-tick {
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #7ee787;
}

.env-panel-hint {
  font-size: 10px;
  color: #888;
}

.env-panel-expanded {
  width: 240px;
  background: rgba(22, 22, 30, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.env-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 12px;
  font-weight: 600;
  color: #ddd;
  letter-spacing: 0.5px;
}

.env-panel-close {
  background: none;
  border: none;
  color: #888;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.env-panel-close:hover {
  color: #fff;
}

.env-rows {
  padding: 8px 14px 12px;
}

.env-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.env-key {
  color: #888;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

.env-val {
  color: #e0e0e0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

.env-val-code {
  color: #7ee787;
  background: rgba(126, 231, 135, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.bool-true {
  color: #7ee787;
}

.bool-false {
  color: #666;
}

.env-val-tick {
  color: #7ee787;
  font-weight: 600;
}

.env-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 6px 0;
}
</style>
