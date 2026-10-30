<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><Aim /></el-icon>
      Props 稳定性：更新传染与监控
    </h1>
    <p class="page-desc">
      核心规则：<strong
        >父组件 re-render 时逐个比对每个子组件 VNode 的新旧 props，任一 prop 的值
        （<code>Object.is</code>）变了该子组件就 update，全部相等则跳过</strong
      >。透传"源头值"会让变化传染给全部项； 先在父组件折算成"结果值"再传，只有结果翻转的项才更新 ——
      100 项列表实测：100 → 2
    </p>

    <!-- 触发规则 -->
    <SectionCard :section="s.trigger">
      <table class="mini-table">
        <thead>
          <tr>
            <th>会触发更新的场景</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>透传了高频变化的源头值</strong></td>
            <td><code>:active-id="activeId"</code>，activeId 一变，100 项的该 prop 全部算"变了"</td>
          </tr>
          <tr>
            <td><strong>父组件重新计算导致 prop 结果变化</strong></td>
            <td><code>:active="item.id === activeId"</code>，只有结果真的翻转的项才算变</td>
          </tr>
          <tr>
            <td><strong>prop 是每次新建的对象/数组/内联函数</strong></td>
            <td>
              <code>:style="{...}"</code>、<code>@click="() =&gt; fn()"</code>
              每次都是新引用，永远判为"变了"（隐蔽陷阱）
            </td>
          </tr>
          <tr>
            <td><strong>变化的内联 slot 内容</strong></td>
            <td>slot 内容随父组件渲染变化时，子组件被迫更新（常被忽略）</td>
          </tr>
          <tr>
            <td><strong>provide 的值变化且子组件 inject 了它</strong></td>
            <td>注入的响应式依赖变化会让子组件更新（不走 props 的旁路）</td>
          </tr>
        </tbody>
      </table>
      <ul class="bullets">
        <li>
          <strong>不会触发</strong>：父组件 re-render 但该子组件<strong>每个 prop 值都没变</strong>
          → <code>shouldUpdateComponent</code> 返回 false，子组件 render 不执行。
        </li>
        <li>
          <strong>事件函数补充</strong>：<code>@click="handler"</code>
          经编译器缓存、引用稳定，不会导致更新；
          <code>@click="() =&gt; handler(item)"</code>
          内联箭头函数每次渲染都是新引用。需要传参时优先在子组件
          <code>emit('xxx', item)</code> 让父组件拿参数。
        </li>
      </ul>
    </SectionCard>

    <!-- 现场实验 -->
    <SectionCard :section="s.demo">
      <p class="desc">
        100 行列表，两种传参方式可切换。<strong>点击列表行</strong>切换激活项，或点"无关更新"改一个与列表无关的状态。
        每轮操作统计有多少个子组件真的执行了更新（子组件内 <code>onUpdated</code> 上报），
        右侧"更新 N 次"是每个实例的累计数。
      </p>
      <div class="controls">
        <el-radio-group :model-value="mode" @change="switchMode">
          <el-radio-button value="source">源头透传 :active-id</el-radio-button>
          <el-radio-button value="result">结果透传 :active</el-radio-button>
        </el-radio-group>
        <el-button @click="unrelatedUpdate">无关更新（prop 全没变）</el-button>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">本轮操作</span>
          <b>{{ lastRound || '—' }}</b>
        </div>
        <div class="stat">
          <span class="stat-label">本轮更新的子组件</span>
          <b class="hot">{{ lastBump === null ? '—' : `${lastBump} / 100 项` }}</b>
        </div>
        <div class="stat">
          <span class="stat-label">当前激活项</span>
          <b>#{{ activeId }}</b>
        </div>
      </div>
      <div class="expect">
        <table class="mini-table">
          <thead>
            <tr>
              <th>预期结果</th>
              <th>源头透传</th>
              <th>结果透传</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>点击列表行切换激活</td>
              <td>100 项（传染）</td>
              <td><strong>2 项</strong>（仅翻转项）</td>
            </tr>
            <tr>
              <td>无关状态变化</td>
              <td>0 项</td>
              <td>0 项</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="list">
        <div v-for="(item, i) in items" :key="item.id" class="line">
          <div class="line-main" @click="setActive(item.id)">
            <PropsListItem
              :index="i"
              :name="item.name"
              :id="item.id"
              :active="mode === 'result' ? item.id === activeId : undefined"
              :active-id="mode === 'source' ? activeId : undefined"
              @bumped="onBumped"
            />
          </div>
          <span class="line-count">更新 {{ counts[i] }} 次</span>
        </div>
      </div>
    </SectionCard>

    <!-- 如何避免 -->
    <SectionCard :section="s.avoid">
      <p class="desc">
        <strong
          >第一层（本页核心）：不要把"源头值"直接透传给每个子组件，先在父组件里折算成子组件真正需要的、低频变化的"结果值"。</strong
        >
      </p>
      <pre class="code" v-pre>
&lt;!-- ❌ 源头透传：一变动全传染 --&gt;
&lt;ListItem :id="item.id" :active-id="activeId" /&gt;

&lt;!-- ✅ 结果透传：只有结果翻转的项才变 --&gt;
&lt;ListItem :id="item.id" :active="item.id === activeId" /&gt;</pre>
      <p class="desc">第二层：其他配套手段：</p>
      <table class="mini-table">
        <thead>
          <tr>
            <th>手段</th>
            <th>作用</th>
            <th>适用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>computed</code></td>
            <td>缓存派生结果，避免每次渲染重算新对象</td>
            <td>父组件算 active 列表</td>
          </tr>
          <tr>
            <td><code>v-memo</code>（3.2+）</td>
            <td>依赖数组不变则跳过该节点/子树的更新</td>
            <td>长列表大块内容</td>
          </tr>
          <tr>
            <td><code>shallowRef</code></td>
            <td>大对象只做浅层响应，避免深层依赖触发</td>
            <td>配置对象、大数据</td>
          </tr>
          <tr>
            <td><strong>拆分组件</strong></td>
            <td>把高频变化的部分隔离成独立小组件，让变化不外溢</td>
            <td>列表行内局部状态</td>
          </tr>
          <tr>
            <td><strong>稳定引用</strong></td>
            <td>对象/数组用 reactive/shallowRef 持有不内联新建；事件用命名函数而非内联箭头</td>
            <td>通用</td>
          </tr>
          <tr>
            <td><strong>稳定 key</strong></td>
            <td>v-for 用业务 id，不用 index</td>
            <td>列表增删场景</td>
          </tr>
          <tr>
            <td><code>v-once</code></td>
            <td>静态内容只渲染一次</td>
            <td>完全不变化的块</td>
          </tr>
        </tbody>
      </table>
      <p class="desc">
        <strong>判断值不值得做</strong>：依然是那个乘法 ——
        <code>省下的实例数 = 列表长度 × 每条里受影响的组件数</code>。只在<strong
          >大型列表 + 高频变化</strong
        >时才值得为此牺牲抽象；只渲染几次的组件不用折腾。
      </p>
    </SectionCard>

    <!-- 如何监控 -->
    <SectionCard :section="s.monitor">
      <table class="mini-table">
        <thead>
          <tr>
            <th>层次</th>
            <th>工具</th>
            <th>用法 / 输出</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>快速确认"更新了没"</td>
            <td><code>onUpdated</code></td>
            <td>组件内打日志，每更新一次触发一次（本页实验的计数来源）</td>
          </tr>
          <tr>
            <td>定位"谁触发的"</td>
            <td><code>onRenderTriggered</code></td>
            <td>打印触发重渲染的 key / type</td>
          </tr>
          <tr>
            <td>看"读了哪些依赖"</td>
            <td><code>onRenderTracked</code></td>
            <td>与 onRenderTriggered 配合，完整还原依赖链</td>
          </tr>
          <tr>
            <td>可视化耗时</td>
            <td><code>app.config.performance = true</code> + DevTools Performance 面板</td>
            <td>录制后看到每个组件的 render / patch 耗时条</td>
          </tr>
          <tr>
            <td>页面高亮重渲染</td>
            <td>vue-scan / why-did-you-render 等</td>
            <td>高亮正在更新的组件、报告"值没变却更新"的无操作渲染</td>
          </tr>
          <tr>
            <td>生产环境</td>
            <td><code>performance.mark / measure</code></td>
            <td>包裹关键组件取线上真实数据，注意采样与开销</td>
          </tr>
        </tbody>
      </table>
      <ul class="bullets">
        <li>
          <strong>开发阶段排查</strong>：onRenderTriggered 找触发源 → onUpdated 确认影响范围 →
          DevTools Performance 看耗时。
        </li>
        <li>
          <strong>优化前后验证</strong>：用 onUpdated 计数对比两种写法的子组件更新次数（本页：100 →
          2）。
        </li>
        <li><strong>线上回归</strong>：只保留轻量的 performance.mark，避免调试钩子进生产包。</li>
      </ul>
    </SectionCard>

    <!-- 一句话收尾 -->
    <SectionCard :section="s.takeaway">
      <blockquote class="quote">
        <strong>触发条件</strong>：父组件 re-render 时任一 prop 值（Object.is）变化，子组件就
        update；透传源头值会让变化"传染"给全部项。
        <strong>避免方式</strong>：在父组件把源头折算成结果值再传，配合 computed / v-memo / 稳定引用
        / 拆分组件，并且只在长列表里做。 <strong>监控方式</strong>：onUpdated
        确认、onRenderTriggered 定位、app.config.performance + DevTools 量化，生产用
        performance.mark。
      </blockquote>
    </SectionCard>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { Aim } from '@element-plus/icons-vue'
import PropsListItem from '@/components/PropsListItem.vue'
import SectionCard from '@/components/SectionCard.vue'
// 章节数据单一来源：卡片 header、侧边目录都由它构建
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

// ---- 实验数据：100 行固定列表 ----
const ROWS = 100
const items = Array.from({ length: ROWS }, (_, i) => ({ id: i + 1, name: `用户 ${i + 1}` }))

// source=源头透传 | result=结果透传
const mode = ref('source')
const activeId = ref(3)
const unrelatedTick = ref(0)
const counts = ref(Array(ROWS).fill(0)) // 每个子组件的累计更新次数
const lastBump = ref(null) // 本轮操作中真正更新的子组件数
const lastRound = ref('')

// 本轮窗口：子组件 onUpdated → emit bumped → 记入集合，nextTick 后统一结算
let pendingIdx = new Set()

function onBumped(index) {
  pendingIdx.add(index)
}

async function finishRound(label) {
  await nextTick()
  await nextTick() // 第二个 nextTick 确保 onUpdated 回调全部跑完
  lastBump.value = pendingIdx.size
  if (pendingIdx.size) {
    counts.value = counts.value.map((c, i) => (pendingIdx.has(i) ? c + 1 : c))
  }
  lastRound.value = label
  pendingIdx = new Set()
}

function setActive(id) {
  if (id === activeId.value) return
  activeId.value = id
  finishRound(`点击行 → 激活 #${id}`)
}

async function unrelatedUpdate() {
  unrelatedTick.value++
  await finishRound('无关状态变化（prop 全没变）')
}

// 模式切换会改变 props 集合（undefined ↔ 有值）引发全量更新，清零计数并丢弃该轮窗口
async function switchMode(m) {
  mode.value = m
  counts.value = Array(ROWS).fill(0)
  lastBump.value = null
  lastRound.value = ''
  await nextTick()
  await nextTick()
  pendingIdx = new Set()
}
</script>

<style scoped>
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

.stat b.hot {
  color: var(--el-color-danger);
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
  max-height: 460px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 6px 10px;
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.line + .line {
  border-top: 1px dashed var(--el-border-color-lighter);
}

.line-main {
  flex: 1;
  min-width: 0;
}

.line-count {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
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
  { key: 'trigger', title: '触发规则：父组件 re-render 时子组件更新与否' },
  { key: 'demo', title: '现场实验：100 项列表的更新计数' },
  { key: 'avoid', title: '如何避免：props 稳定性 + 配套手段' },
  { key: 'monitor', title: '如何监控：从 onUpdated 到 performance.mark' },
  { key: 'takeaway', title: '一句话收尾' },
]
</script>
