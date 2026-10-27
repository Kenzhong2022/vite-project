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
    <h1 class="title">🔄 版本热更新</h1>
    <p class="subtitle">用户不刷新页面也能感知到你发布了新版本。</p>

    <!-- Build 脚本 -->
    <section class="block">
      <h2>① 修改 package.json 的 build 脚本</h2>
      <p class="desc">
        在执行 <code>vite build</code> 之前，先用一行 Node 命令往
        <code>public/version.json</code> 写一个时间戳。 <code>public/</code> 目录里的文件会被 Vite
        原样复制到 <code>dist/</code>，所以用户访问时就能拿到这个 version.json。
      </p>
      <div class="code">
        <pre><code>"build": "node -e \"require('fs').writeFileSync('public/version.json', JSON.stringify({version: Date.now()}))\" && vite build"</code></pre>
      </div>
      <p class="desc">
        产物示例：<code>public/version.json</code> →
        <code>{ "version": 1761547200000 }</code>
      </p>
    </section>

    <!-- 前端轮询 -->
    <section class="block">
      <h2>② 前端轮询 version.json</h2>
      <p class="desc">
        在 <code>App.vue</code> 里，仅在生产环境（<code>import.meta.env.PROD</code>） 下每 5 秒
        fetch 一次 version.json，和内存里的版本号对比。 不一致就
        <code>confirm()</code> 询问用户是否刷新。
      </p>
      <div class="code">
        <pre><code>async function checkVersion() {
  const res = await fetch(`{BASE_URL}version.json?t=${Date.now()}`)
  const data = await res.json()
  if (currentVersion &amp;&amp; currentVersion !== data.version) {
    if (confirm('发现新版本，是否立即刷新？')) {
      window.location.reload()
    }
  }
}</code></pre>
      </div>
      <p class="desc">加 <code>?t=Date.now()</code> 是为了绕过浏览器对 version.json 的缓存。</p>
    </section>

    <!-- 运行时状态 -->
    <section class="block live">
      <h2>③ 运行时状态</h2>
      <div v-if="!isProd" class="warn">
        ⚠️ 当前是开发环境，不会开启轮询（避免浪费 Dev Server 资源）。 Build
        后部署到生产环境才会生效。
      </div>
      <div v-else class="status-grid">
        <div class="status-item">
          <span class="status-label">当前 version.json</span>
          <span class="status-val mono">
            {{ currentVersion ?? '等待首次请求…' }}
          </span>
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
    </section>

    <!-- 注意事项 -->
    <section class="block">
      <h2>💡 为什么能绕过缓存？</h2>
      <ul class="tips">
        <li>
          <strong>缓存策略由部署平台决定，Vite 不管这件事</strong>。
          <code>public/</code> 目录不加哈希 ≠ 不缓存。
          在 Cloudflare Pages / Netlify / Nginx 上，不带哈希的 public 文件会被缓存很久
          （典型是 <code>max-age=31536000, immutable</code>）。
        </li>
        <li>
          <strong>version.json 靠 _headers 强制不缓存</strong>。
          <code>public/_headers</code> 只给 <code>/version.json</code> 和
          <code>/index.html</code> 设了
          <code>Cache-Control: no-cache, no-store, must-revalidate</code>，
          这才是浏览器每次都回源的原因。
        </li>
        <li>
          <strong>Cloudflare Workers 默认偏保守</strong>——线上所有静态资源
          （public 图片、Vite 带哈希资源）都被设成了
          <code>max-age=0, must-revalidate</code>，每次都回源验证。
          所以你当前 public 图片和 src/assets 的缓存行为一样，
          但别把 Cloudflare Workers 默认当成通用规则。
        </li>
        <li>
          <strong>JS/CSS chunk 带哈希是另一条路</strong>——Vite 给它加哈希
          （如 <code>index-CKA8M2mX.js</code>），文件名变 = URL 变 = 浏览器自然拉新。
          如果部署平台给带哈希的资源配了 <code>immutable</code>，
          浏览器会一直用本地缓存，只在 reload 时检查。
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.7;
  color: #333;
}
.title {
  font-size: 1.8rem;
  margin-bottom: 4px;
}
.subtitle {
  color: #666;
  margin-bottom: 32px;
}
.block {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 20px;
  background: #fafbfc;
}
.block h2 {
  margin: 0 0 10px;
  font-size: 1.1rem;
}
.desc {
  color: #555;
  margin: 0 0 12px;
  font-size: 0.92rem;
}
.code code {
  all: unset;
  display: block;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  margin-bottom: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
.code pre {
  margin: 0;
}
.desc code,
.tips code {
  background: #eef0f2;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 0.85rem;
  color: #d63384;
}
.block.live {
  background: #f0f9ff;
  border-color: #91d5ff;
}
.warn {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.9rem;
  color: #ad6800;
}
.status-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.status-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-val {
  font-size: 1.1rem;
  font-weight: 600;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.tick {
  color: #1a7f37;
}
.status-item.error .status-val {
  color: #cf222e;
}
.tips {
  margin: 0;
  padding-left: 20px;
  color: #555;
  font-size: 0.9rem;
}
.tips li {
  margin-bottom: 6px;
}
</style>
