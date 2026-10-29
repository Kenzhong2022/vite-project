<script setup>
import wrongImg from '/JapaneseCity.png'
import assetImage from '@/assets/JapaneseCity.png'
import SectionCard from '@/components/SectionCard.vue'
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

// ========================================
// Demo 1: 正确引入 public 目录资源
// ========================================
const publicImageUrl = '/JapaneseCity.png'
const imageName = 'JapaneseCity'
const ext = '.png'
const publicDynamicUrl = `/${imageName}${ext}`

// ========================================
// Demo 2: 错误示范 - import public 资源
// ========================================
// Vite 8 Rolldown 不再硬报错，静默解析为字面量 URL："/JapaneseCity.png"
// 绕过 Vite 资源处理（无哈希、不优化、不参与依赖图）
// Vite 7 (esbuild + rollup) 会硬报错：
//   "Assets in public directory cannot be imported from JavaScript."
console.log('wrongImg =', wrongImg) // 运行时输出："/JapaneseCity.png"

// ========================================
// Demo 3: 正确引入 src/assets 目录资源
// ========================================
</script>

<template>
  <div class="page">
    <h1 class="page-title">静态资源处理</h1>
    <p class="page-desc">
      <strong>public</strong> 目录用全局路径 <code>/xxx.png</code> 拼接；
      <strong>src/assets</strong> 目录用 import，Vite 自动加哈希。
    </p>

    <!-- Demo 1 -->
    <SectionCard :section="s.demo1">
      <p class="desc">
        public 目录文件构建后原样复制到根目录，用 <code>/</code> 开头拼接路径访问。
      </p>

      <pre class="code">
const publicImageUrl = '/JapaneseCity.png'
const publicDynamicUrl = `/${imageName}${ext}`  // 动态拼接也行</pre>

      <div class="demo-output">
        <div class="img-wrap">
          <img :src="publicImageUrl" class="demo-img" alt="public 直接路径" />
          <span>直接路径</span>
        </div>
        <div class="img-wrap">
          <img :src="publicDynamicUrl" class="demo-img" alt="public 动态拼接" />
          <span>动态拼接</span>
        </div>
      </div>
    </SectionCard>

    <!-- Demo 2 -->
    <SectionCard :section="s.demo2">
      <p class="desc">
        Rolldown 把 <code>import wrongImg from '/JapaneseCity.png'</code> 静默解析为字面量
        <code>wrongImg = "/JapaneseCity.png"</code>。build 不中断、图片能显示， 但这是反模式——绕过了
        Vite 的全部资源处理能力。
      </p>

      <pre class="code err">
import wrongImg from '/JapaneseCity.png'
console.log('wrongImg =', wrongImg)  // "/JapaneseCity.png"</pre>

      <div class="demo-output">
        <div class="img-wrap">
          <img :src="wrongImg" class="demo-img" alt="错误 import public" />
          <span>错误 import 也能显示？</span>
        </div>
      </div>

      <el-alert type="error" :closable="false" show-icon title="3 个隐患">
        <ul class="bullets">
          <li>
            <strong>无哈希</strong>：缓存失效依赖 reload，public/ 文件变了浏览器不一定能感知
          </li>
          <li>
            <strong>绕过优化</strong>：Vite 不压缩、不处理 public 文件，dist 里两份同名 PNG 冗余
          </li>
          <li>
            <strong>不参与依赖图</strong>：code-splitting、按需加载、动态 import 前缀分析全部失效
          </li>
        </ul>
      </el-alert>
    </SectionCard>

    <!-- Demo 3 -->
    <SectionCard :section="s.demo3">
      <p class="desc">
        src/assets 文件被 Vite 打包处理，import 后得到带哈希的 URL （如
        <code>/assets/JapaneseCity-abc123.png</code>），缓存策略最理想。
      </p>

      <pre class="code">import assetImage from '@/assets/JapaneseCity.png'</pre>

      <div class="demo-output">
        <div class="img-wrap">
          <img :src="assetImage" class="demo-img" alt="assets PNG" />
          <span>assets（带哈希）</span>
        </div>
      </div>
    </SectionCard>

    <!-- 总结 -->
    <SectionCard :section="s.summary">
      <el-table :data="compareData" border size="small">
        <el-table-column prop="feature" label="特性" width="140" />
        <el-table-column prop="public" label="public 目录" />
        <el-table-column prop="assets" label="src/assets 目录" />
      </el-table>
    </SectionCard>
  </div>
</template>

<script>
// 章节数据单一来源：卡片 header 与侧边目录（router meta.toc，见 router/index.js）都由它构建；
// script setup 可直接引用这里的顶层声明（编译后同属一个模块）
export const sections = [
  { key: 'demo1', title: '正确引入 public 目录资源' },
  { key: 'demo2', title: '错误 import public 资源' },
  { key: 'demo3', title: '正确引入 src/assets 目录资源' },
  { key: 'summary', title: '总结对比' },
]

export default {
  data() {
    return {
      compareData: [
        { feature: '访问方式', public: '/xxx.png 全局路径', assets: "import img from '...'" },
        { feature: 'Vite 处理', public: '原样复制', assets: ' 压缩、哈希、按类型打包' },
        {
          feature: '适合存放',
          public: 'favicon、robots.txt、第三方库',
          assets: '项目内引用的图片、字体',
        },
        { feature: '动态拼接', public: ' 运行时拼接路径', assets: ' 需静态分析路径前缀' },
        {
          feature: 'URL 结构',
          public: '/JapaneseCity.png',
          assets: '/assets/JapaneseCity-abc123.png',
        },
      ],
    }
  },
}
</script>

<style scoped>
/* 页面壳层与正文排版（.page/.page-card/.page-title/.page-desc/.desc/.code/.bullets）
   由全局 style.css 统一提供，这里只保留本页特有的样式 */
.code.err {
  border-left: 3px solid var(--el-color-danger);
}

.demo-output {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin: 0 0 12px;
}

.img-wrap {
  flex: 1;
  text-align: center;
}

.img-wrap span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.demo-img {
  max-width: 240px;
  max-height: 160px;
  border-radius: 4px;
  display: block;
  margin: 0 auto;
}
</style>
