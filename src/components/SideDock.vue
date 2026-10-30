<!--
  SideDock：右侧悬浮工具条
  - ul>li 结构：品牌标识（Vite，notes 域入口，点击回首页）→ 媒体工具入口（Picture）→ 回到顶部（常驻末项，带分隔线）
  - 域高亮由数据驱动：当前路由条目的 navItems.zone === 'notes' 点亮 Vite，'media' 点亮 Picture
  - 定位右侧垂直居中避开右下角的 EnvPanel；z-index 100 低于 EnvPanel 的 9999
-->
<script setup>
import { computed } from 'vue'
import { Picture, Top } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { navItems } from '@/config/navigation.js'

const route = useRoute()
const router = useRouter()

// 当前路由的域归属：按 to 精确匹配 navItems（exact 语义）；不在导航内的路由无域、不高亮
const currentZone = computed(() => navItems.find((item) => item.to === route.path)?.zone)

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <ul class="side-dock">
    <li
      class="side-dock-brand"
      :class="{ 'is-active': currentZone === 'notes' }"
      title="回到首页"
      @click="router.push('/')"
    >
      Vite
    </li>
    <li
      class="side-dock-btn"
      :class="{ 'is-active': currentZone === 'media' }"
      title="图片抠图"
      @click="router.push('/image-cutout')"
    >
      <el-icon :size="18"><Picture /></el-icon>
    </li>
    <li class="side-dock-btn side-dock-top" title="回到顶部" @click="backToTop">
      <el-icon :size="18"><Top /></el-icon>
    </li>
  </ul>
</template>

<style scoped>
.side-dock {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  margin: 0;
  padding: 4px;
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  box-shadow: var(--el-box-shadow-light);
  user-select: none;
  color: var(--el-text-color-regular);
}

.side-dock-brand {
  padding: 8px 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 8px;
}

/* 品牌项域高亮：与功能项一致的 light-9 底色 */
.side-dock-brand.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.side-dock-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.side-dock-btn:hover,
.side-dock-btn.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 末项：分隔线拉开与功能项的距离，hover 背景铺满整行，下圆角贴合容器 */
.side-dock-top {
  width: 100%;
  align-self: stretch;
  border-top: 1px solid var(--el-border-color-lighter);
  border-radius: 0 0 8px 8px;
}
</style>
