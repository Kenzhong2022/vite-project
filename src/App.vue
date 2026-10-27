<script setup>
import { onMounted, onUnmounted } from 'vue'
import StaticAssetsDemo from '@/components/StaticAssetsDemo.vue'

let timer = null
let currentVersion = null

async function checkVersion() {
  // 仅在打包后的生产环境执行
  if (!import.meta.env.PROD) return

  try {
    // 加时间戳绕过任何可能的缓存
    const res = await fetch(`/version.json?t=${Date.now()}`)
    const data = await res.json()
    const newVersion = data.version

    if (!currentVersion) {
      currentVersion = newVersion // 首次加载，记录当前版本
    } else if (currentVersion !== newVersion) {
      // 发现版本不一致
      if (confirm('发现新版本，页面内容已更新。是否立即刷新加载最新功能？')) {
        window.location.reload()
      }
    }
  } catch (e) {
    console.warn('版本检查失败:', e)
  }
}

onMounted(() => {
  checkVersion()
  timer = setInterval(checkVersion, 5 * 1000) // 5秒查一次 (本地测试可改成 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <StaticAssetsDemo />
</template>
