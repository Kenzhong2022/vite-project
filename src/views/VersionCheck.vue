<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const POLL_INTERVAL = 5
const remaining = ref(POLL_INTERVAL)
const currentVersion = ref(null)
const lastError = ref(null)
const isProd = import.meta.env.PROD

let pollTimer = null
let countdownTimer = null

async function checkVersion() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`)
    const data = await res.json()
    currentVersion.value = data.version
    lastError.value = null
  } catch (e) {
    lastError.value = e.message
  }
}

onMounted(() => {
  if (!isProd) return
  checkVersion()
  countdownTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) remaining.value = POLL_INTERVAL
  }, 1000)
  pollTimer = setInterval(checkVersion, POLL_INTERVAL * 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div class="page">
    <h1 class="page-title">版本热更新</h1>
    <p class="page-desc">用户不刷新页面也能感知到你发布了新版本。</p>

    <el-card class="page-card" shadow="never">
      <template #header>① 修改 package.json 的 build 脚本</template>
      <p class="desc">
        执行 <code>vite build</code> 之前，先用一行 Node 命令往
        <code>public/version.json</code> 写时间戳。 <code>public/</code> 里的文件会被 Vite
        原样复制到 <code>dist/</code>。
      </p>
      <pre class="code">
"build": "node -e \"require('fs').writeFileSync('public/version.json', JSON.stringify({version: Date.now()}))\" && vite build"</pre>
      <p class="desc small">
        产物示例：<code>public/version.json</code> → <code>{ "version": 1761547200000 }</code>
      </p>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>② 前端轮询 version.json</template>
      <p class="desc">
        在 <code>App.vue</code> 里，仅 <code>import.meta.env.PROD</code> 下每 5 秒 fetch 一次，
        与内存版本号对比，不一致就 <code>confirm()</code> 询问刷新。
      </p>
      <pre class="code">
async function checkVersion() {
  const res = await fetch(`{BASE_URL}version.json?t=${Date.now()}`)
  const data = await res.json()
  if (currentVersion &amp;&amp; currentVersion !== data.version) {
    if (confirm('发现新版本，是否立即刷新？')) {
      window.location.reload()
    }
  }
}</pre>
      <p class="desc small"><code>?t=Date.now()</code> 用于绕过浏览器缓存。</p>
    </el-card>

    <el-card class="page-card live" shadow="never">
      <template #header>③ 运行时状态</template>
      <el-alert v-if="!isProd" type="warning" :closable="false" show-icon>
        开发环境不会开启轮询（避免浪费 Dev Server 资源），build 部署后生效。
      </el-alert>
      <div v-else class="status-grid">
        <div class="status-item">
          <span class="status-label">当前 version.json</span>
          <span class="status-val mono">{{ currentVersion ?? '等待首次请求…' }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">下一次检查</span>
          <span class="status-val mono tick">{{ remaining }}s</span>
        </div>
        <div v-if="lastError" class="status-item error">
          <span class="status-label">错误</span>
          <span class="status-val mono">{{ lastError }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>💡 为什么能绕过缓存？</template>
      <ul class="bullets">
        <li>
          <strong>缓存策略由部署平台决定</strong>。<code>public/</code> 不加哈希 ≠
          不缓存。Cloudflare Pages / Netlify / Nginx 上，不带哈希的 public 文件通常被缓存 1
          年（<code>max-age=31536000, immutable</code>）。
        </li>
        <li>
          <strong>version.json 靠 _headers 强制不缓存</strong>。<code>public/_headers</code> 只给
          <code>/version.json</code> 和 <code>/index.html</code> 设了
          <code>Cache-Control: no-cache, no-store, must-revalidate</code>，这才是每次都回源的原因。
        </li>
        <li>
          <strong>Cloudflare Workers 默认偏保守</strong>——所有静态资源（public 图片、Vite
          带哈希资源）都被设成了 <code>max-age=0, must-revalidate</code>，每次都回源验证。这是
          Workers 特例，不是通用规则。
        </li>
        <li>
          <strong>JS/CSS chunk 带哈希是另一条路</strong>——Vite 加哈希（如
          <code>index-CKA8M2mX.js</code>），文件名变 = URL 变 = 浏览器自然拉新。
        </li>
      </ul>
    </el-card>
  </div>
</template>

<style scoped>
.page-card.live {
  border-color: var(--el-color-info-light-5);
  background: var(--el-color-info-light-9);
}

.status-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-val {
  font-size: 16px;
  font-weight: 600;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.tick {
  color: var(--el-color-success);
}

.status-item.error .status-val {
  color: var(--el-color-danger);
}
</style>
