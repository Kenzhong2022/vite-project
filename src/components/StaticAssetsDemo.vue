<script setup>
// ========================================
// Demo 1: 正确引入 public 目录资源
// ========================================
// public 目录下的文件不会被 Vite 处理，构建后直接原样复制到输出目录根路径
// 访问方式：始终以 / 开头，对应 public 下的相对路径
// 模板中可以直接写绝对路径，也可以通过变量拼接
const publicImageUrl = '/JapaneseCity.png'

// 动态拼接也是合法的（public 目录的资源路径是运行时确定的）
const imageName = 'JapaneseCity'
const ext = '.png'
const publicDynamicUrl = `/${imageName}${ext}`

// ========================================
// Demo 2: ❌ 错误示范 - import public 资源（已注释，取消注释会报错）
// ========================================
// 以下代码取消注释会导致 Vite 报错：
// "Assets in public directory cannot be imported from JavaScript."
//
// import wrongImg from '/JapaneseCity.png'
//
// 原因：public 目录的资源不经过 Vite 的模块解析和打包流程，
// 它们在构建后直接放到根目录，所以不能用 ES Module 的 import 语法引入。

// ========================================
// Demo 3: 正确引入 src/assets 目录资源
// ========================================
// src/assets 下的文件会被 Vite 处理（哈希重命名、压缩、按类型打包）
// import 后拿到的是 Vite 处理后的最终 URL（构建时自动拼接哈希）
import assetImage from '@/assets/JapaneseCity.png'
</script>

<template>
  <div class="demo-container">
    <h1>这是新版本内容！</h1>

    <h1 class="main-title">静态资源处理</h1>
    <p class="subtitle">
      <strong>public</strong> 目录资源使用全局变量拼接的方式；
      <strong>src/assets</strong> 目录资源通过 import 引入，会被 Vite 自动拼接哈希处理。
    </p>

    <!-- Demo 1: public 正确用法 -->
    <section class="demo-section">
      <h2 class="demo-title demo-public">✅ Demo 1: 正确引入 public 目录资源</h2>
      <p class="demo-desc">
        public 目录的文件在构建后会原样复制到根目录，访问时以 <code>/</code> 开头拼接路径即可。
      </p>

      <div class="code-block">
        <p><strong>Script:</strong></p>
        <pre><code>const publicImageUrl = '/JapaneseCity.png'
const imageName = 'JapaneseCity'
const publicDynamicUrl = `/${imageName}${ext}`</code></pre>
        <p><strong>Template:</strong></p>
        <pre><code>&lt;img :src="publicImageUrl" /&gt;
&lt;img :src="publicDynamicUrl" /&gt;</code></pre>
      </div>

      <div class="demo-output">
        <p>直接路径访问:</p>
        <img :src="publicImageUrl" class="demo-img" alt="public 直接路径" />
        <p>动态拼接访问:</p>
        <img :src="publicDynamicUrl" class="demo-img" alt="public 动态拼接" />
      </div>
    </section>

    <!-- Demo 2: public 错误用法 -->
    <section class="demo-section">
      <h2 class="demo-title demo-error">❌ Demo 2: 错误 import public 资源（会导致 bug）</h2>
      <p class="demo-desc">
        public 目录的文件<strong>不能</strong>使用 ES Module 的 <code>import</code> 语法引入。
        取消下面注释会报：<code
          >Assets in public directory cannot be imported from JavaScript.</code
        >
      </p>

      <div class="code-block error-block">
        <pre><code>// ❌ 下面这行取消注释会直接报错
// import wrongImg from '/JapaneseCity.png'</code></pre>
      </div>

      <div class="error-card">
        <p class="error-icon">🚫</p>
        <p><strong>Vite 报错信息：</strong></p>
        <pre><code>Assets in public directory cannot be imported from JavaScript.

If you intend to import that asset, put it in src/assets/ instead,
and get its resolved URL via import { assetUrl } from 'virtual:client/public/JapaneseCity.png'</code></pre>
      </div>
    </section>

    <!-- Demo 3: assets 正确用法 -->
    <section class="demo-section">
      <h2 class="demo-title demo-assets">📦 Demo 3: 正确引入 src/assets 目录资源</h2>
      <p class="demo-desc">
        src/assets 下的文件会被 Vite 打包处理，import 后得到的是带哈希的最终 URL（如
        <code>/assets/JapaneseCity-abc123.png</code>），有助于浏览器缓存更新。
      </p>

      <div class="code-block">
        <p><strong>Script:</strong></p>
        <pre><code>import assetImage from '@/assets/JapaneseCity.png'</code></pre>
        <p><strong>Template:</strong></p>
        <pre><code>&lt;img :src="assetImage" /&gt;</code></pre>
      </div>

      <div class="demo-output">
        <p>PNG 图片 (assets):</p>
        <img :src="assetImage" class="demo-img" alt="assets PNG" />
        <p class="hint">
          ℹ️ 构建后 Vite 会自动给 assets 资源加上哈希后缀， 比如
          <code>/assets/JapaneseCity.8f3a2b1c.png</code>
        </p>
      </div>
    </section>

    <!-- 总结对比 -->
    <section class="summary-section">
      <h2 class="summary-title">📝 总结对比</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th>特性</th>
            <th>public 目录</th>
            <th>src/assets 目录</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>访问方式</td>
            <td><code>/xxx.png</code> 全局路径</td>
            <td><code>import img from '...'</code></td>
          </tr>
          <tr>
            <td>是否打包处理</td>
            <td>❌ 不处理，原样复制</td>
            <td>✅ 压缩、哈希、按类型打包</td>
          </tr>
          <tr>
            <td>适合存放</td>
            <td>favicon、robots.txt、第三方库等</td>
            <td>项目内引用的图片、字体等资源</td>
          </tr>
          <tr>
            <td>动态拼接</td>
            <td>✅ 运行时拼接路径</td>
            <td>⚠️ 需 Vite 静态分析路径前缀</td>
          </tr>
          <tr>
            <td>URL 结构</td>
            <td><code>/JapaneseCity.png</code></td>
            <td><code>/assets/JapaneseCity-abc123.png</code></td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 960px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.main-title {
  text-align: center;
  font-size: 2.2rem;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #42d392, #647eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 36px;
}

.subtitle strong {
  color: #42d392;
}

.demo-section {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 28px;
  background: #fafbfc;
  transition: box-shadow 0.2s;
}

.demo-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.demo-title {
  margin-top: 0;
  font-size: 1.25rem;
  padding-bottom: 10px;
  border-bottom: 2px solid;
}

.demo-public {
  color: #1a7f37;
  border-color: #1a7f37;
}

.demo-error {
  color: #cf222e;
  border-color: #cf222e;
}

.demo-assets {
  color: #647eff;
  border-color: #647eff;
}

.demo-desc {
  color: #555;
  margin: 12px 0 16px;
}

.demo-desc code,
.hint code,
.summary-table code {
  background: #eef0f2;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.88rem;
  color: #d63384;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.code-block p {
  margin: 0 0 6px;
  color: #9cdcfe;
  font-size: 0.85rem;
}

.code-block pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
}

.error-block {
  border-left: 4px solid #cf222e;
}

.demo-output {
  background: #fff;
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.demo-output p {
  color: #555;
  font-size: 0.9rem;
  margin: 8px 0;
}

.demo-img {
  max-width: 280px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  margin: 10px auto;
}

.demo-img.small {
  max-width: 80px;
}

.error-card {
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px 20px;
}

.error-icon {
  font-size: 2rem;
  margin: 0 0 8px;
}

.error-card pre {
  background: #fee2e2;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0 0;
  font-size: 0.85rem;
}

.hint {
  color: #888 !important;
  font-size: 0.85rem !important;
  font-style: italic;
}

.summary-section {
  margin-top: 36px;
}

.summary-title {
  font-size: 1.4rem;
  margin-bottom: 16px;
  text-align: center;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-table th,
.summary-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.summary-table th {
  background: linear-gradient(90deg, #42d392, #647eff);
  color: white;
}

.summary-table tr:last-child td {
  border-bottom: none;
}

.summary-table tr:hover td {
  background: #f8f9fa;
}
</style>
