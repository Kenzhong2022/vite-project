<!--
  SideDock：右侧悬浮工具条
  - ul>li 结构：品牌标识（Vite）→ 图像入口（Picture 图标）→ 回到顶部（常驻末项，带分隔线）
  - 目前仅回到顶部有交互行为；前两项是展示位，后续接入功能时补 click 即可
  - 定位右侧垂直居中：避开右下角的 EnvPanel；z-index 100 低于 EnvPanel 的 9999
-->
<script setup>
import { Picture, Top } from '@element-plus/icons-vue'

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <ul class="side-dock">
    <li class="side-dock-brand">Vite</li>
    <li class="side-dock-btn" title="图像">
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
}

.side-dock-brand {
  padding: 8px 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.side-dock-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.side-dock-btn:hover {
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
