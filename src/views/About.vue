<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><InfoFilled /></el-icon>
      关于这个项目
    </h1>

    <SectionCard :section="s.stack">
      <el-tag class="tag" effect="plain">Vite 8</el-tag>
      <el-tag class="tag" effect="plain">Vue 3</el-tag>
      <el-tag class="tag" effect="plain">Vue Router 4</el-tag>
      <el-tag class="tag" effect="plain">Element Plus</el-tag>
      <el-tag class="tag" effect="plain">Cloudflare Workers</el-tag>
    </SectionCard>

    <SectionCard :section="s.env">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="MODE">{{ env.MODE }}</el-descriptions-item>
        <el-descriptions-item label="BASE_URL">{{ env.BASE_URL }}</el-descriptions-item>
        <el-descriptions-item label="PROD">{{ env.PROD }}</el-descriptions-item>
        <el-descriptions-item label="DEV">{{ env.DEV }}</el-descriptions-item>
        <el-descriptions-item label="SSR">{{ env.SSR }}</el-descriptions-item>
      </el-descriptions>
    </SectionCard>

    <SectionCard :section="s.hmr">
      <p class="desc">
        生产环境每 5 秒检查一次 <code>version.json</code>，发现新版本时提示用户刷新。
        右下角悬浮窗可展开查看完整环境信息。
      </p>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import SectionCard from '@/components/SectionCard.vue'
// 章节数据单一来源：卡片 header、侧边目录都由它构建（本页无 strong 分点）
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

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
<script>
// 章节数据单一来源：卡片 header 与侧边目录（router meta.toc，见 router/index.js）都由它构建；
// script setup 可直接引用这里的顶层声明（编译后同属一个模块）
export const sections = [
  { key: 'stack', title: '技术栈' },
  { key: 'env', title: '当前环境' },
  { key: 'hmr', title: '版本热更新' },
]
</script>
