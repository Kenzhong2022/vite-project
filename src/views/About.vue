<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><InfoFilled /></el-icon>
      关于这个项目
    </h1>

    <el-card class="page-card" shadow="never">
      <template #header>技术栈</template>
      <el-tag class="tag" effect="plain">Vite 8</el-tag>
      <el-tag class="tag" effect="plain">Vue 3</el-tag>
      <el-tag class="tag" effect="plain">Vue Router 4</el-tag>
      <el-tag class="tag" effect="plain">Element Plus</el-tag>
      <el-tag class="tag" effect="plain">Cloudflare Workers</el-tag>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>当前环境</template>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="MODE">{{ env.MODE }}</el-descriptions-item>
        <el-descriptions-item label="BASE_URL">{{ env.BASE_URL }}</el-descriptions-item>
        <el-descriptions-item label="PROD">{{ env.PROD }}</el-descriptions-item>
        <el-descriptions-item label="DEV">{{ env.DEV }}</el-descriptions-item>
        <el-descriptions-item label="SSR">{{ env.SSR }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>版本热更新</template>
      <p class="desc">
        生产环境每 5 秒检查一次 <code>version.json</code>，发现新版本时提示用户刷新。
        右下角悬浮窗可展开查看完整环境信息。
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'

const env = computed(() => ({
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  SSR: import.meta.env.SSR,
}))
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag {
  margin-right: 6px;
  margin-bottom: 6px;
}
</style>
