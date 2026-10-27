<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import StaticAssetsDemo from '@/components/StaticAssetsDemo.vue'

const POLL_INTERVAL = 5 // 秒
const remaining = ref(POLL_INTERVAL)
const isProd = import.meta.env.PROD

let pollTimer = null
let countdownTimer = null
let currentVersion = null

async function checkVersion() {
  if (!isProd) return

  try {
    const res = await fetch(`/version.json?t=${Date.now()}`)
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

  // 首次立即检查
  checkVersion()

  // 独立的 1 秒倒计时，用于驱动 UI
  countdownTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      remaining.value = POLL_INTERVAL
    }
  }, 1000)

  // 实际的版本检查：仍用 5 秒轮询
  pollTimer = setInterval(checkVersion, POLL_INTERVAL * 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <StaticAssetsDemo />

  <!-- 版本检查倒计时悬浮窗 -->
  <div v-if="isProd" class="version-countdown">
    <span class="version-countdown-label">版本检查</span>
    <span class="version-countdown-value">{{ remaining }}s</span>
  </div>
</template>

<style>
.version-countdown {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: default;
  user-select: none;
  transition: opacity 0.25s ease;
}

.version-countdown:hover {
  opacity: 0.85;
}

.version-countdown-label {
  font-size: 11px;
  color: #aaa;
  letter-spacing: 0.5px;
}

.version-countdown-value {
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #7ee787;
}
</style>
