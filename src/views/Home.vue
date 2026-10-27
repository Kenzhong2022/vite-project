<template>
  <div class="home">
    <h1>
      <el-icon class="welcome-icon"><Promotion /></el-icon>
      欢迎来到 Vite + Vue 3 示例站
    </h1>
    <p class="home-desc">
      这是一个 Vite + Vue 3 + Vue Router + Element Plus 搭建的演示项目。
    </p>

    <div class="home-cards">
      <div class="card" @click="$router.push('/static-assets')">
        <div class="card-icon">
          <el-icon><Files /></el-icon>
        </div>
        <h3>静态资源 Demo</h3>
        <p>看 Vite 怎么处理 public、assets、动态拼接路径</p>
      </div>
      <div class="card" @click="$router.push('/about')">
        <div class="card-icon">
          <el-icon><InfoFilled /></el-icon>
        </div>
        <h3>关于</h3>
        <p>项目信息、环境变量、部署说明</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Promotion, Files, InfoFilled } from '@element-plus/icons-vue'
const router = useRouter()
</script>

<style scoped>
.home {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}

.home h1 {
  font-size: 26px;
  margin: 0 0 8px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.welcome-icon {
  font-size: 28px;
  color: #7ee787;
}

.home-desc {
  color: #aaa;
  margin: 0 0 28px;
  font-size: 14px;
}

.home-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(126, 231, 135, 0.3);
  background: rgba(126, 231, 135, 0.05);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 8px;
  color: #7ee787;
}

.card h3 {
  margin: 0 0 6px;
  color: #fff;
  font-size: 15px;
}

.card p {
  margin: 0;
  color: #888;
  font-size: 12px;
  line-height: 1.5;
}
</style>
