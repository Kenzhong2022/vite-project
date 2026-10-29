<template>
  <div class="page">
    <section v-for="group in categoryGroups" :key="group.name" class="card-section">
      <h3 class="section-title">{{ group.name }}</h3>
      <el-row :gutter="12">
        <el-col v-for="card in group.items" :key="card.to" :xs="24" :sm="12" :md="6">
          <el-card class="home-card" shadow="hover" @click="$router.push(card.to)">
            <template #header>
              <el-icon class="card-icon"><component :is="card.icon" /></el-icon>
              {{ card.label }}
            </template>
            <p>{{ card.desc }}</p>
          </el-card>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup>
import { navItems, categoryOrder } from '@/config/navigation.js'

// 按 categoryOrder 的顺序把导航项归组，供首页分区展示
const categoryGroups = categoryOrder.map((name) => ({
  name,
  items: navItems.filter((item) => item.category === name),
}))
</script>

<style scoped>
/* 垂直间距放在 flex 容器层：挂在卡片上的 margin-bottom 会被 height:100% + stretch 吞掉 */
.page :deep(.el-row) {
  row-gap: 12px;
}

.card-section + .card-section {
  margin-top: 28px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
