<script setup>
// 递归目录组件：纯嵌套 div 实现，不依赖 el-menu / el-tree
// 章节数据结构（children 与父级结构完全一致，可无限嵌套）：
// {
//   icon?: Component,        // 可选，Element Plus 图标组件
//   title: string,           // 章节标题
//   children?: Section[],    // 子章节，结构同章节本身
// }
defineProps({
  sections: { type: Array, required: true },
})
</script>

<template>
  <div class="toc-group">
    <div v-for="section in sections" :key="section.title" class="toc-section">
      <div class="toc-row">
        <el-icon v-if="section.icon" class="toc-icon">
          <component :is="section.icon" />
        </el-icon>
        <span class="toc-title">{{ section.title }}</span>
      </div>
      <!-- 子章节结构一致，递归渲染自身（script setup 可通过文件名自引用） -->
      <div v-if="section.children?.length" class="toc-children">
        <TocTree :sections="section.children" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toc-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition:
    color 0.15s,
    background 0.15s;
}

.toc-row:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.toc-icon {
  font-size: 15px;
  color: var(--el-color-primary);
}

/* 子章节层：缩进 + 左侧参考线表达层级 */
.toc-children {
  margin-left: 10px;
  padding-left: 14px;
  border-left: 1px solid var(--el-border-color-lighter);
}
</style>
