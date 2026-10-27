<template>
  <div class="about">
    <h1 class="page-title">
      <el-icon><InfoFilled /></el-icon>
      关于这个项目
    </h1>

    <section class="section">
      <h2>技术栈</h2>
      <el-tag class="tag" effect="plain">Vite 8</el-tag>
      <el-tag class="tag" effect="plain">Vue 3</el-tag>
      <el-tag class="tag" effect="plain">Vue Router 4</el-tag>
      <el-tag class="tag" effect="plain">Element Plus</el-tag>
      <el-tag class="tag" effect="plain">Cloudflare Workers</el-tag>
    </section>

    <section class="section">
      <h2>当前环境</h2>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="MODE">{{ env.MODE }}</el-descriptions-item>
        <el-descriptions-item label="BASE_URL">{{ env.BASE_URL }}</el-descriptions-item>
        <el-descriptions-item label="PROD">{{ env.PROD }}</el-descriptions-item>
        <el-descriptions-item label="DEV">{{ env.DEV }}</el-descriptions-item>
        <el-descriptions-item label="SSR">{{ env.SSR }}</el-descriptions-item>
      </el-descriptions>
    </section>

    <section class="section">
      <h2>版本热更新</h2>
      <p class="desc">
        生产环境每 5 秒检查一次 <code>version.json</code>，发现新版本时提示用户刷新。
        右下角悬浮窗可展开查看完整环境信息。
      </p>
    </section>
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
.about {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-size: 22px;
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
}

.section {
  margin-bottom: 28px;
}

.section h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--el-text-color-primary);
}

.tag {
  margin-right: 6px;
  margin-bottom: 6px;
}

.desc {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}

.desc code {
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 13px;
  color: var(--el-color-primary);
}
</style>
