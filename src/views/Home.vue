<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="home-card" shadow="hover" @click="$router.push('/static-assets')">
          <template #header>
            <el-icon class="card-icon"><Files /></el-icon>
            静态资源
          </template>
          <p>public vs src/assets 的处理差异</p>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="home-card" shadow="hover" @click="$router.push('/pre-bundle')">
          <template #header>
            <el-icon class="card-icon"><Lightning /></el-icon>
            预构建
          </template>
          <p>Native ESM vs Bundle 模式 + 预构建原理</p>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="home-card" shadow="hover" @click="$router.push('/version-check')">
          <template #header>
            <el-icon class="card-icon"><RefreshRight /></el-icon>
            版本热更新
          </template>
          <p>build 脚本改写 + 前端轮询 version.json</p>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="home-card" shadow="hover" @click="$router.push('/about')">
          <template #header>
            <el-icon class="card-icon"><InfoFilled /></el-icon>
            关于
          </template>
          <p>项目信息、环境变量、部署说明</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { Promotion, Files, Lightning, RefreshRight, InfoFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
/* 垂直间距放在 flex 容器层：挂在卡片上的 margin-bottom 会被 height:100% + stretch 吞掉 */
.page :deep(.el-row) {
  row-gap: 12px;
}

.home-card {
  cursor: pointer;
  height: 100%;
}

.home-card :deep(.el-card__header) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.card-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.home-card p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}
</style>
