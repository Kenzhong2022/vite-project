<template>
  <div class="about">
    <h1>
      <el-icon class="about-title-icon"><InfoFilled /></el-icon>
      关于这个项目
    </h1>

    <section class="about-section">
      <h2>技术栈</h2>
      <ul>
        <li><strong>Vite 8</strong> — 构建工具</li>
        <li><strong>Vue 3</strong> — 前端框架（Composition API）</li>
        <li><strong>Vue Router 4</strong> — 前端路由</li>
        <li><strong>Cloudflare Workers</strong> — 部署平台</li>
      </ul>
    </section>

    <section class="about-section">
      <h2>当前环境</h2>
      <table class="env-table">
        <tr>
          <td>MODE</td>
          <td><code>{{ env.MODE }}</code></td>
        </tr>
        <tr>
          <td>BASE_URL</td>
          <td><code>{{ env.BASE_URL }}</code></td>
        </tr>
        <tr>
          <td>PROD</td>
          <td><code>{{ env.PROD }}</code></td>
        </tr>
        <tr>
          <td>DEV</td>
          <td><code>{{ env.DEV }}</code></td>
        </tr>
        <tr>
          <td>SSR</td>
          <td><code>{{ env.SSR }}</code></td>
        </tr>
      </table>
    </section>

    <section class="about-section">
      <h2>版本热更新</h2>
      <p>
        生产环境每 5 秒检查一次 <code>version.json</code>，发现新版本时提示用户刷新。
        右下角悬浮窗可展开查看完整环境信息。
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'

const env = computed(() => ({
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  SSR: import.meta.env.SSR,
}))
</script>

<style scoped>
.about {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}

.about h1 {
  color: #fff;
  font-size: 26px;
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.about-title-icon {
  font-size: 28px;
  color: #7ee787;
}

.about-section {
  margin-bottom: 28px;
}

.about-section h2 {
  color: #ddd;
  font-size: 15px;
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.about-section ul {
  margin: 0;
  padding-left: 20px;
  color: #bbb;
  font-size: 14px;
  line-height: 1.9;
}

.about-section p {
  color: #bbb;
  font-size: 14px;
  line-height: 1.8;
}

.about code {
  background: rgba(126, 231, 135, 0.12);
  color: #7ee787;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.env-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.env-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.env-table td:first-child {
  color: #888;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  width: 120px;
}

.env-table td:last-child {
  text-align: right;
}
</style>
