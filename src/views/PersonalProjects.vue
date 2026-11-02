<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><FolderOpened /></el-icon>
      个人项目
    </h1>

    <!-- 个人项目页无需目录：不配置 sections/meta.toc，内容用普通 el-card 承载 -->
    <el-card class="page-card" shadow="never">
      <p class="desc">
        这个分类用于收纳个人作品 / 小工具，目前还是占位页。
        后续新增项目时：在 <code>src/config/navigation.js</code> 加导航项（category 填
        <code>Personal Project</code>），在 <code>src/views/</code> 建页面，
        并在 <code>src/router/index.js</code> 注册路由即可。
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { FolderOpened } from '@element-plus/icons-vue'
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.desc {
  margin: 0;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
</style>
