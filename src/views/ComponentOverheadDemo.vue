<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><Histogram /></el-icon>
      多余组件抽象的性能开销
    </h1>
    <p class="page-desc">
      一个最简单的例子：<strong>标签列表</strong>。Badge 组件只嵌套一层，却因为它处在
      <code>v-for</code> 里、每行出现 3 次，<code>100 × 3 = 300</code>
      的乘法把它放大成了"数百个组件实例"。<strong>决定数量的不是嵌套深度，而是「列表长度 × 每条里出现的次数」</strong>
      —— 本页用同一份列表数据实测两种写法的渲染耗时
    </p>

    <!-- 场景说明 -->
    <SectionCard :section="s.scenario">
      <p class="desc">
        一个用户列表，<strong>100 个用户</strong>，每个用户有平均 <strong>3 个标签</strong>。
        有人为了复用样式，写了个纯包裹的 <code>Badge</code> 组件 ——
        没有任何逻辑、没有插槽转发、没有状态，只套一层 <code>span</code> 加个样式。
      </p>
      <div class="formula">
        <span class="formula-num">100</span> 个用户 ×
        <span class="formula-num">3</span> 个标签 =
        <span class="formula-num hot">300</span> 个 Badge 组件实例
      </div>
      <ul class="bullets">
        <li>
          打开 Vue DevTools 的组件树，能看到 <strong>300 个 <code>&lt;Badge&gt;</code> 节点</strong>。
          注意 Badge 本身只有<strong>一层</strong>，嵌套并不深 —— 数量是 <code>v-for</code> 乘出来的。
        </li>
        <li>
          每个实例都不是免费的：创建 vnode、实例化组件对象、跑 setup、diff 时逐个对比 ——
          <strong>每次数据更新都要 patch 这 300 个实例</strong>。
        </li>
      </ul>
    </SectionCard>

    <!-- 现场实验 -->
    <SectionCard :section="s.demo">
      <p class="desc">
        同一份数据、同样的视觉效果，两种实现可随时切换。每次<strong>切换模式 / 改行数 / 点重新渲染</strong>，
        都会用 <code>performance.now()</code> 计时一次完整 patch（从数据变更到 DOM 更新完成）。
        重新渲染会打乱标签组合，让所有 <code>:key</code> 变化、触发全量卸载重建，方便观察差异。
      </p>
      <div class="controls">
        <el-radio-group v-model="mode">
          <el-radio-button value="component">Badge 组件</el-radio-button>
          <el-radio-button value="inline">内联 span</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="rowCount">
          <el-radio-button :value="100">100 行</el-radio-button>
          <el-radio-button :value="1000">1000 行</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="rerender">重新渲染并计时</el-button>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">行数</span>
          <b>{{ rowCount }}</b>
        </div>
        <div class="stat">
          <span class="stat-label">每行标签</span>
          <b>3 个</b>
        </div>
        <div class="stat">
          <span class="stat-label">组件实例数</span>
          <b>{{ instanceCount }}</b>
        </div>
        <div class="stat">
          <span class="stat-label">上次 patch 耗时</span>
          <b>{{ lastMs === null ? '—' : lastMs.toFixed(2) + ' ms' }}</b>
        </div>
        <div class="stat">
          <span class="stat-label">当前设置均值</span>
          <b>{{ avgText }}</b>
        </div>
      </div>
      <table v-if="history.length" class="mini-table">
        <thead>
          <tr>
            <th>#</th>
            <th>实现方式</th>
            <th>行数</th>
            <th>组件实例</th>
            <th>patch 耗时</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(h, i) in history" :key="i">
            <td>{{ history.length - i }}</td>
            <td>{{ h.modeText }}</td>
            <td>{{ h.rows }}</td>
            <td>{{ h.instances }}</td>
            <td>{{ h.ms.toFixed(2) }} ms</td>
          </tr>
        </tbody>
      </table>
      <div class="list">
        <div v-for="user in users" :key="user.id" class="row">
          <span class="name">{{ user.name }}</span>
          <template v-if="mode === 'component'">
            <DemoBadge v-for="tag in user.tags" :key="tag" :text="tag" />
          </template>
          <template v-else>
            <span v-for="tag in user.tags" :key="tag" class="badge">{{ tag }}</span>
          </template>
        </div>
      </div>
    </SectionCard>

    <!-- 代码对比 -->
    <SectionCard :section="s.code">
      <p class="desc">去掉这个抽象：Badge 没有任何逻辑，直接内联即可，不再产生组件实例。</p>
      <p class="desc">优化前 —— 每个标签都套一层 Badge 组件：</p>
      <pre class="code" v-pre>&lt;!-- Badge.vue：啥逻辑都没有，只套一层 span 加个样式 --&gt;
&lt;script setup&gt;
defineProps({ text: String })
&lt;/script&gt;
&lt;template&gt;
  &lt;span class="badge"&gt;{{ text }}&lt;/span&gt;
&lt;/template&gt;

&lt;!-- UserList.vue --&gt;
&lt;template&gt;
  &lt;div v-for="user in users" :key="user.id" class="row"&gt;
    &lt;span&gt;{{ user.name }}&lt;/span&gt;
    &lt;!-- 每个标签都套一层 Badge 组件 --&gt;
    &lt;Badge v-for="tag in user.tags" :key="tag" :text="tag" /&gt;
  &lt;/div&gt;
&lt;/template&gt;</pre>
      <p class="desc">优化后 —— 直接写 span，不再产生组件实例：</p>
      <pre class="code" v-pre>&lt;template&gt;
  &lt;div v-for="user in users" :key="user.id" class="row"&gt;
    &lt;span&gt;{{ user.name }}&lt;/span&gt;
    &lt;!-- 直接写 span，不再产生组件实例 --&gt;
    &lt;span v-for="tag in user.tags" :key="tag" class="badge"&gt;{{ tag }}&lt;/span&gt;
  &lt;/div&gt;
&lt;/template&gt;</pre>
      <table class="mini-table">
        <thead>
          <tr>
            <th></th>
            <th>组件实例数</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>优化前</td>
            <td>100 行 + <strong>300 个 Badge</strong></td>
            <td>每次数据更新都要 patch 这 300 个实例</td>
          </tr>
          <tr>
            <td>优化后</td>
            <td>100 行 + <strong>0 个 Badge</strong></td>
            <td>只剩 300 个普通 DOM 节点</td>
          </tr>
        </tbody>
      </table>
      <p class="desc">
        <strong>省下 300 个组件实例</strong> —— 这就是官方文档说的"数百个"。
      </p>
    </SectionCard>

    <!-- 对照：什么情况下不值得 -->
    <SectionCard :section="s.caveat">
      <p class="desc">
        如果 Badge 在每行<strong>只出现 1 次</strong>（比如只显示用户的等级）：
      </p>
      <pre class="code" v-pre>&lt;Badge :text="user.level" /&gt;   &lt;!-- 每行 1 次 --&gt;</pre>
      <p class="desc">
        100 × 1 = <strong>100 个实例</strong>，这就是"只减少几个 / 一百来个"的量级，收益一般
        —— 为了省它去牺牲 Badge 的复用性<strong>不划算</strong>。
      </p>
    </SectionCard>

    <!-- 一句话点题 -->
    <SectionCard :section="s.takeaway">
      <blockquote class="quote">
        例子里的 Badge 只嵌套了一层，但因为它处在 <code>v-for</code> 里、每行出现 3 次，
        <code>100 × 3 = 300</code> 的乘法就把它放大成了"数百个实例"。
        <strong>决定数量的是「列表长度 × 每条里出现的次数」，不是组件嵌套多深。</strong>
      </blockquote>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Histogram } from '@element-plus/icons-vue'
import DemoBadge from '@/components/DemoBadge.vue'
import SectionCard from '@/components/SectionCard.vue'
// 章节数据单一来源：卡片 header、侧边目录都由它构建
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

// ---- 实验数据：100/1000 个用户，每人固定 3 个标签 ----
const TAGS = ['Vue', 'React', 'TypeScript', 'Node', 'Vite', 'CSS', '工程化', '性能', '算法', '浏览器']
let uid = 0
let version = 0

function makeUsers(n) {
  // version 参与取模 → 每次重新生成的标签组合都不同 → :key 全部变化 → 全量卸载重建
  version += 1
  return Array.from({ length: n }, (_, i) => ({
    id: ++uid,
    name: `用户 ${i + 1}`,
    tags: [0, 1, 2].map((k) => TAGS[(i * 7 + k * 3 + version) % TAGS.length]),
  }))
}

const rowCount = ref(100)
const mode = ref('component')
const users = ref(makeUsers(100))

const instanceCount = computed(() =>
  mode.value === 'component' ? `${rowCount.value * 3}（= ${rowCount.value} × 3）` : '0',
)

// ---- 计时：数据变更 → DOM patch 完成（performance.now 包住一次 flush）----
const lastMs = ref(null)
const history = ref([]) // 最近 8 次：{ modeText, rows, instances, ms }

async function record() {
  const t0 = performance.now()
  await nextTick()
  const ms = performance.now() - t0
  lastMs.value = ms
  history.value.unshift({
    modeText: mode.value === 'component' ? 'Badge 组件' : '内联 span',
    rows: rowCount.value,
    instances: mode.value === 'component' ? rowCount.value * 3 : 0,
    ms,
  })
  if (history.value.length > 8) history.value.pop()
}

async function rerender() {
  users.value = makeUsers(rowCount.value)
  await record()
}

// 改行数：重新生成 + 计时
watch(rowCount, async (n) => {
  users.value = makeUsers(n)
  await record()
})

// 切换模式：组件实例 ↔ 普通 DOM 节点互转，同样是全量 patch，顺带计时
watch(mode, () => record())

// 当前模式 + 行数下的历史均值（排除其它设置的样本）
const avgText = computed(() => {
  const modeText = mode.value === 'component' ? 'Badge 组件' : '内联 span'
  const list = history.value.filter((h) => h.modeText === modeText && h.rows === rowCount.value)
  if (!list.length) return '—'
  const avg = list.reduce((sum, h) => sum + h.ms, 0) / list.length
  return `${avg.toFixed(2)} ms · ${list.length} 次均值`
})
</script>

<style scoped>
.formula {
  font-size: 15px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  margin-bottom: 12px;
}

.formula-num {
  font-size: 18px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-color-primary);
}

.formula-num.hot {
  color: var(--el-color-danger);
}

.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat b {
  font-size: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-text-color-primary);
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 12px;
}

.mini-table th,
.mini-table td {
  border: 1px solid var(--el-border-color-lighter);
  padding: 6px 10px;
  text-align: left;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.mini-table th {
  background: var(--el-fill-color-light);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.list {
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 8px 12px;
}

.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 7px 0;
}

.row + .row {
  border-top: 1px dashed var(--el-border-color-lighter);
}

.name {
  font-size: 13px;
  color: var(--el-text-color-regular);
  min-width: 72px;
}

/* 内联模式的徽标样式（组件模式由 DemoBadge 自己的 scoped 样式负责） */
.badge {
  display: inline-block;
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-8);
}

.quote {
  margin: 0;
  padding: 12px 16px;
  border-left: 3px solid var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
}
</style>
<script>
// 章节数据单一来源：卡片 header 与侧边目录（router meta.toc，见 router/index.js）都由它构建
export const sections = [
  { key: 'scenario', title: '场景：标签列表与组件实例的乘法' },
  { key: 'demo', title: '现场实验：组件实例 vs 内联 DOM' },
  { key: 'code', title: '去掉抽象：前后代码对比' },
  { key: 'caveat', title: '对照：什么情况下不值得' },
  { key: 'takeaway', title: '一句话点题' },
]
</script>
