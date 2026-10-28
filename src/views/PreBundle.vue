<script setup>
import BundleBasedImg from '@/assets/BasedBundle.png'
import ESMBasedImg from '@/assets/BasedESM.png'
</script>

<template>
  <div class="page">
    <h1 class="page-title">预构建（Pre-bundling）</h1>
    <p class="page-desc">
      为什么 Vite 在开发模式下把代码视为<strong>原生 ES 模块</strong>，又为什么还要"预构建"？
    </p>

    <el-card class="page-card" shadow="never">
      <template #header>浏览器原生支持 ESM 是前提</template>
      <p class="desc">
        在浏览器还不认识 ESM 的年代，Webpack 等打包工具必须递归解析所有模块， 融合成一个 Bundle
        浏览器才能运行。<strong>现在现代浏览器原生支持 ES 模块</strong>—— 浏览器自己能解析
        <code>import</code>、发 HTTP 请求获取模块、维护依赖图和执行顺序。
      </p>
      <p class="desc">
        既然浏览器自己能干"模块加载"，Vite 就不需要再替浏览器"预先把所有模块合成一个文件"了。
      </p>
    </el-card>

    <!-- 对比图 -->
    <el-card class="page-card" shadow="never">
      <template #header>两种开发模式对比</template>
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <div class="img-box">
            <img :src="BundleBasedImg" alt="Bundle based dev server" />
            <p class="img-caption">
              传统 Bundle 模式：必须先打包完才能启动，改一行就得重建整个 Bundle
            </p>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="img-box">
            <img :src="ESMBasedImg" alt="Native ESM based dev server" />
            <p class="img-caption">
              Vite Native ESM 模式：服务器瞬间 Ready，按需编译，改一行只重发这一行
            </p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>按需编译 + 极速 HMR</template>
      <p class="desc">
        Vite 服务器启动时<strong>不提前打包</strong>，把入口 HTML 直接扔给浏览器。 浏览器解析
        <code>import</code> 后发起请求，Vite 才开始干活：
      </p>
      <ul class="bullets">
        <li>TS / .vue 文件 → 即时编译成 JS</li>
        <li>普通 JS 文件 → 直接返回</li>
        <li>未被请求的模块 → 暂时完全不管</li>
      </ul>
      <p class="desc">
        因为浏览器维护着自己的模块依赖图，每个文件都是独立 HTTP 请求。 修改一个文件时，Vite
        只需要让浏览器<strong>重新请求这一个模块</strong>（加上受影响的边界），
        而不是"牵一发而动全身"重建整个 Bundle——这就是<strong>精准且极速的 HMR</strong>。
      </p>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>那为什么还需要"预构建"？</template>
      <el-alert type="warning" :closable="false" show-icon title="两个现实难题">
        <ul class="bullets">
          <li>
            <strong>第三方包格式不统一</strong>：<code>node_modules</code> 里很多是 CommonJS / UMD，
            浏览器不认识 ESM 的 <code>import</code> / <code>export</code> 语法。
          </li>
          <li>
            <strong>碎片化模块引发请求风暴</strong>：像 lodash-es 这种包里有几百个微型模块，
            如果让浏览器直接发请求，瞬间几百个 HTTP 请求拖垮网络。
          </li>
        </ul>
      </el-alert>
      <p class="desc" style="margin-top: 12px">
        所以 Vite 必须在服务器启动或首次请求时，用 esbuild（Vite 7+）或 Rolldown（Vite 8）
        把第三方依赖<strong>提前转成 ESM</strong> 并<strong>合并为单个文件</strong>。
        这就是"预构建"——在 Native ESM 模式下，为了让第三方库也能顺畅运行而打的补丁。
      </p>
      <p class="desc">
        预构建产物默认缓存在 <code>node_modules/.vite</code>，只有依赖变化、锁文件变化或
        手动删除目录时才会重新执行。
      </p>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>npm 依赖解析：裸模块导入 → URL 重写</template>
      <p class="desc">
        原生 ES 导入<strong>不支持裸模块导入</strong>——浏览器不认识
        <code>'my-dep'</code> 这种 Node.js 风格的包名，直接抛错。 Vite
        检测到源码中的裸模块导入后，会做两件事：
      </p>
      <pre class="code">
// 你写的源码
import { someMethod } from 'my-dep'

// Vite 预构建 + 重写后，浏览器实际加载的
import { someMethod } from '/node_modules/.vite/deps/my-dep.js?v=f3sf2ebd'</pre>
      <el-alert type="info" :closable="false" show-icon title="预构建 + URL 重写，两步走">
        <ul class="bullets">
          <li>
            <strong>① 预构建</strong>：Rolldown（Vite 8）扫描所有源码，把裸模块导入的依赖找出来，
            转成 ESM 格式 + 合并为单个文件，缓存到 <code>node_modules/.vite/deps/</code>
          </li>
          <li>
            <strong>② 重写导入路径</strong>：把源码里的
            <code>from 'my-dep'</code> 替换成浏览器能识别的完整 URL，<code>?v=</code>
            查询参数是内容哈希，缓存策略最理想
          </li>
        </ul>
      </el-alert>
      <p class="desc" style="margin-top: 12px">
        这步预构建由 Rolldown 执行，使得 Vite 的冷启动时间比任何基于纯 JavaScript 的打包器都快得多。
      </p>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header>一句话总结</template>
      <p class="desc">
        Vite 把"打包"的压力从服务器转移给浏览器，
        实现了<strong>极速冷启动</strong>和<strong>按需编译</strong>； 而"预构建"是让这套 Native ESM
        模式能够兼容现实世界里
        <strong>格式混杂 + 模块碎片化</strong>的第三方依赖。
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.bullets {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
}

.bullets li {
  margin-bottom: 4px;
}

.bullets strong {
  color: var(--el-text-color-primary);
}

.img-box {
  text-align: center;
}

.img-box img {
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.img-caption {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
