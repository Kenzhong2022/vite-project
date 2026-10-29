<script setup>
import { ref } from 'vue'
import { onMounted, onActivated, onDeactivated, onUnmounted } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
// 章节数据单一来源：卡片 header、侧边目录都由它构建（本页无 strong 分点）
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

const count = ref(0)
const logs = ref([])
let seq = 0

function log(msg) {
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  logs.value.unshift(`${++seq}. [${t}] ${msg}`)
  if (logs.value.length > 12) logs.value.pop()
}

function add(n) {
  count.value += n
}

function reset() {
  count.value = 0
}

onMounted(() => log('onMounted —— 首次挂载（只有第一次进入会触发）'))
onActivated(() => log('onActivated —— 首次挂载 + 每次从缓存重新插入时'))
onDeactivated(() => log('onDeactivated —— 从 DOM 移除进入缓存（真正卸载时也会先触发）'))
onUnmounted(() => log('onUnmounted —— 真正卸载（被移出 include 或超出 max 时才会发生）'))

log('setup() 执行 —— 每次「重新激活」不会重跑，仅首次')
</script>

<template>
  <div class="page">
    <h1 class="page-title">KeepAlive 缓存测试</h1>
    <p class="page-desc">切到其他页再切回来，看 count 是否保持、日志走了哪个钩子。</p>

    <SectionCard :section="s.counter">
      <div class="counter-row">
        <span class="counter-num">{{ count }}</span>
        <div class="counter-btns">
          <el-button type="primary" @click="add(1)">+1</el-button>
          <el-button @click="add(10)">+10</el-button>
          <el-button plain @click="reset">清零</el-button>
        </div>
      </div>
    </SectionCard>

    <SectionCard :section="s.logs">
      <div class="log-list">
        <div v-for="item in logs" :key="item" class="log-item">{{ item }}</div>
      </div>
    </SectionCard>

    <!-- header 覆写为带官方文档链接，目录章节名仍取数据里的 title -->
    <SectionCard :section="s.rules">
      <template #header>
        规则依据（<a
          class="doc-link"
          href="https://cn.vuejs.org/guide/built-ins/keep-alive#include-exclude"
          target="_blank"
          rel="noopener"
          >Vue 官方文档 · Include / Exclude</a
        >）
      </template>
      <p class="desc">
        <code>&lt;KeepAlive&gt;</code> <strong>默认会缓存其内部的所有组件实例</strong>， 但可以通过
        <code>include</code> 和 <code>exclude</code> prop 来定制该行为。 这两个 prop
        的值都可以是：以英文逗号分隔的字符串、一个正则表达式，或包含这两种类型的一个数组
        （正则与数组需使用 <code>v-bind</code>）。
      </p>
      <p class="desc">
        <strong>它根据组件的 <code>name</code> 选项进行匹配</strong>——组件如果想要条件性地被
        KeepAlive 缓存，就必须显式声明一个 <code>name</code> 选项。 本项目的 name 由
        <code>plugins/vue-route-name.js</code> 在构建时注入
        <code>defineOptions({{ '{ name' }}: 'keep-alive-test' })</code>，与路由 name 保持一致；
        App.vue 再从路由表 <code>meta.keepAlive</code> 推导 include 名单，两边天然对上。
      </p>
      <p class="desc">
        官方 TIP：3.2.34+ 使用 <code>&lt;script setup&gt;</code> 的单文件组件会
        <strong>自动根据文件名生成 name</strong>。但文件名派生的是
        <code>KeepAliveTest</code>（PascalCase），与路由 name
        <code>keep-alive-test</code>（kebab-case）并不一致，include 匹配不上——
        这正是需要插件显式注入 name 的原因。
      </p>
      <p class="desc">
        <strong>缓存实例的生命周期</strong>：组件实例从 DOM
        上移除但因为被缓存而仍作为组件树的一部分时，
        它将变为<strong>「不活跃」</strong>状态而不是被卸载；重新插入 DOM 时则重新
        <strong>「被激活」</strong>。注意两个细节：<code>onActivated</code> 在首次挂载时也会调用
        （所以首次进入页面日志有两条）；<code>onDeactivated</code> 在组件真正卸载时也会调用。
        这两个钩子对缓存树中的后代组件同样生效。
      </p>
    </SectionCard>
  </div>
</template>

<style scoped>
.counter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.counter-num {
  font-size: 40px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
  min-width: 80px;
  text-align: center;
}

.counter-btns {
  display: flex;
  gap: 8px;
}

.log-list {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.9;
  color: var(--el-text-color-regular);
}

.doc-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.doc-link:hover {
  text-decoration: underline;
}
</style>
<script>
// 章节数据单一来源：卡片 header 与侧边目录（router meta.toc，见 router/index.js）都由它构建；
// script setup 可直接引用这里的顶层声明（编译后同属一个模块）
// 「规则依据」卡片 header 带官方文档链接，页面通过 SectionCard 的 #header 覆写，目录仍取这里的 title
export const sections = [
  { key: 'counter', title: '计数器' },
  { key: 'logs', title: '生命周期日志（新事件在最上）' },
  { key: 'rules', title: '规则依据' },
]
</script>
