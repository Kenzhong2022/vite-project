<script setup>
// 纯分组章节标题：父章节没有正文、只有 title 锚点时使用，
// 渲染为带锚点 id 的标题条（目录可点击定位、滚动可高亮）
defineProps({
  section: { type: Object, required: true },
})
</script>

<template>
  <h2 :id="section.key" class="section-heading">
    <el-icon v-if="section.icon"><component :is="section.icon" /></el-icon>
    {{ section.title }}
  </h2>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 24px 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  /* 锚点定位时给吸顶头部留出空间，与 .page-card 的 scroll-margin-top 一致 */
  scroll-margin-top: 72px;
}
</style>
