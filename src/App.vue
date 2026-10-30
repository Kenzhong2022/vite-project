<!--
  App：应用挂载根 + 应用级横切逻辑
  - 版本轮询在根组件：只要应用在运行就检查新版本，与路由/布局无关
  - EnvPanel（环境面板）消费轮询倒计时 remaining，与轮询同源，一并挂在根组件
  - 布局职责全部在 AppLayout（导航、keep-alive、侧边目录）
-->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import EnvPanel from '@/components/EnvPanel.vue'
import SideDock from '@/components/SideDock.vue'

const POLL_INTERVAL = 5
const remaining = ref(POLL_INTERVAL)

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
  <AppLayout />
  <SideDock />
  <EnvPanel :remaining="remaining" />
</template>
