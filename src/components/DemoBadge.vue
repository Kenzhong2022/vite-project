<!-- 纯包裹组件：没有任何逻辑，只套一层 span 加个样式 —— 性能实验的反面教材 -->
<script setup>
defineProps({ text: String })
</script>

<template>
  <span class="badge">{{ text }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-8);
}
</style>
