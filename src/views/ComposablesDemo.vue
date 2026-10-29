<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><Connection /></el-icon>
      组合式函数：ref vs reactive
    </h1>
    <p class="page-desc">
      先看适用场景：逻辑里有没有<strong>响应式状态与副作用</strong>。实验部分整页共用同一个计数器数据源
      （模块级单例），更新一律走组合式函数导出的 <code>increment</code> / <code>reset</code> ——
      多组件都「解构」消费时，ref 返回值让所有组件保持一致；reactive 返回值一旦解构，各组件拿到各自的值拷贝、互相失联
    </p>

    <!-- 适用场景：什么时候该抽组合式函数 -->
    <SectionCard :section="s.scenarios">
      <p class="desc">
        组合式函数的本质是<strong>封装并复用「有状态逻辑」</strong>—— 它和 lodash
        这类“输入即输出”的无状态工具函数有本质区别：管理的是会随时间变化的<strong>响应式状态</strong>及其<strong>副作用</strong>。
        判断要不要抽，先问一句：这段逻辑里有没有状态或副作用？
      </p>
      <table class="mini-table">
        <thead>
          <tr>
            <th>维度</th>
            <th>组合式函数</th>
            <th>普通工具函数（lodash 风格）</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>状态</td>
            <td>内含响应式状态（ref / computed），随时间变化</td>
            <td>无状态，同样输入永远同样输出</td>
          </tr>
          <tr>
            <td>副作用</td>
            <td>常伴随：事件监听 / 定时器 / DOM 操作，需在生命周期中清理</td>
            <td>无</td>
          </tr>
          <tr>
            <td>调用时机</td>
            <td>只能在 <code>setup()</code> 中同步调用（要关联作用域）</td>
            <td>任意位置随意调用</td>
          </tr>
          <tr>
            <td>典型代表</td>
            <td>useMouse / useFetch / 本项目 useElementTheme</td>
            <td>formatDate / deepClone / 防抖节流的纯实现</td>
          </tr>
        </tbody>
      </table>
      <ul class="bullets">
        <li>
          <strong>适合：交互型 DOM / 浏览器 API</strong> —— useMouse 跟踪鼠标位置、本项目
          <code>useElementTheme</code> 把主题色绑定到 CSS 变量并同步全套色阶（状态 + 事件监听 + 清理，典型闭环）。
        </li>
        <li>
          <strong>适合：异步数据获取</strong> —— useFetch 管理 data / error 状态，进阶版配合
          <code>watchEffect</code> + <code>toValue</code> 还能响应 URL 变化自动重发请求。
        </li>
        <li>
          <strong>适合：跨组件共享状态</strong> —— 状态提升到模块作用域（单例）+ 统一更新入口，
          多个组件消费同一份数据源，本页的 <code>useCounter</code> 就是这个模式。
        </li>
        <li>
          <strong>适合：第三方库实例管理</strong> —— 地图 / 图表 / 编辑器：
          <code>onMounted</code> 初始化、<code>onUnmounted</code> 销毁、响应式参数变化时同步到实例。
        </li>
        <li>
          <strong>不适合：纯计算 / 格式化</strong> —— <code>formatDate(x)</code>
          这类无状态无副作用的写成普通函数即可，套上 <code>use</code> 前缀反而误导使用者。
        </li>
        <li>
          <strong>不适合：一次性、不可复用的逻辑</strong> —— 只在一处用一次也不打算复用的，就地写更直观，抽取只是增加间接层。
        </li>
      </ul>
    </SectionCard>

    <!-- 正确写法：ref 返回值 + 多组件解构 -->
    <SectionCard :section="s['shared-ref']">
      <p class="desc">
        下面每个卡片都是<strong>独立的组件实例</strong>，都在 <code>setup</code> 里解构消费同一个
        <code>useCounterRef()</code>。随便点任意卡片的「+1」：所有消费者同步变化；
        点「添加消费者组件」，新挂载的实例也立刻与大家一致（无论数据源当前是几）。
      </p>
      <pre class="code">// 组合式函数内部（src/composables/useCounter.js）：同一份模块级单例，仅 return 包装不同
const count = ref(0) // 定义在模块作用域 → 所有组件共用同一份数据源

export function useCounterRef() {
  return { count, double, increment, reset } // ✅ 返回 ref 集合
}

// 消费者组件 setup 中（每个卡片实例都执行这句）：
const { count, double, increment, reset } = useCounterRef()
// 解构拿到的是 ref 对象本身，读写 .value 都落在同一个 ref 上 → 多组件永远一致</pre>
      <div class="consumer-grid">
        <CounterConsumer v-for="c in refConsumers" :key="c.id" :label="c.label" mode="ref" />
      </div>
      <div class="toolbar">
        <el-button size="small" @click="addRefConsumer">+ 添加一个消费者组件</el-button>
      </div>
    </SectionCard>

    <!-- 反例：reactive 返回值 + 解构 -->
    <SectionCard :section="s['shared-reactive']">
      <p class="desc">
        <strong>同一份单例状态</strong>，仅把返回值包成 <code>reactive</code>。红色卡片与上一区完全一样地「解构」消费；
        蓝色基准面板则<code>不解构</code>、整体访问代理对象，始终显示数据源真实值。试试：
      </p>
      <ul class="bullets">
        <li>点基准面板「+1」几次：基准在动，红色卡片冻在各自挂载瞬间的快照上（组件与数据源失联）。</li>
        <li>
          点「添加解构消费者」：新卡片在挂载那一刻解构，把<strong>当时</strong>的值冻成自己的快照 ——
          同一数据源，各卡片数字互不相同（<strong>组件之间失联</strong>）。
        </li>
        <li>点红色卡片自己的「+1」：数据源确实变了（基准面板会动），它自己依然纹丝不动。</li>
      </ul>
      <pre class="code">// 组合式函数内部：同一份单例，仅多包一层 reactive
export function useCounterReactive() {
  return reactive({ count, double, increment, reset })
}

// ❌ 红色卡片的写法（每个实例挂载时执行）：解构 reactive 返回值 —— 失败根源
const { count, double, increment, reset } = useCounterReactive()
// 解构 = 把「当时的值」拷贝成普通变量，从此与数据源断开 → 组件之间互不一致

// ✓ 蓝色基准面板的写法：整体持有代理对象，不解构
const live = useCounterReactive()
;({ increment, reset } = live) // 只取函数引用（无值拷贝问题）；行首分号防 ASI，说明见下
// 模板里始终通过代理属性访问 live.count / live.double → 每次读取都被追踪，永远显示最新值</pre>
      <p class="desc small">
        为什么 <code>;({ increment, reset } = live)</code> 行首要加分号？—— JavaScript 的
        <strong>ASI（自动分号插入）规则</strong>：以 <code>(</code> 或 <code>[</code>
        开头的行，若能和上一行连成合法表达式，就<strong>不会</strong>插入分号，而是被解析成对上一行表达式的
        <strong>函数调用延续</strong>（不是"括号配对混淆"）。两种真实翻车现场：
      </p>
      <pre class="code">const live = useCounterReactive()
({ increment, reset } = live) // ✗ 不加分号 → 解析成 useCounterReactive()({...} = live)，调用返回对象直接报错
let live = null
({ increment, reset } = live) // ✗ 不加分号 → 解析成 null({...} = live) → TypeError: null is not a function</pre>
      <p class="desc small">
        注：if 块内紧跟 <code>{</code>（块开始）的那两处解构，前面没有表达式结尾，严格说可省；
        统一加前导分号是<strong>防御性写法</strong> —— 防止日后在上方新增语句后 <code>(</code>
        开头的行被悄悄拼接，ESLint 的 <code>no-unexpected-multiline</code> 与 Prettier 都会强制这一习惯。
      </p>
      <div class="consumer-grid">
        <CounterConsumer
          v-for="c in reactiveConsumers"
          :key="c.id"
          :label="c.label"
          mode="reactive"
        />
        <CounterConsumer label="基准面板（不解构）" mode="live" />
      </div>
      <div class="toolbar">
        <el-button size="small" type="danger" plain @click="addReactiveConsumer">
          + 添加一个解构消费者
        </el-button>
        <el-button size="small" @click="liveState.reset">重置数据源</el-button>
      </div>
    </SectionCard>

    <SectionCard :section="s.why">
      <ul class="bullets">
        <li>
          <strong>解构 = 按值拷贝快照</strong>：reactive 的响应性长在 Proxy 代理对象上，解构把属性「当时的值」
          拷贝成普通变量，从此与数据源再无关联（基础类型尤其如此）。
        </li>
        <li>
          <strong>各组件各拿各的快照</strong>：消费者挂载（解构）的时刻不同，拷到的值也不同 →
          上方红色卡片同源却互不相同，组件之间失联。
        </li>
        <li>
          <strong>更新并没有丢</strong>：<code>increment</code> / <code>reset</code>
          是同一个函数引用，点击后单例状态确实变了（基准面板在动）——
          失联的只是「解构出来的读取路径」，所以静默、难排查。
        </li>
        <li>
          <strong>ref 为什么始终一致</strong>：解构拿到的是 ref 对象本身，读写
          <code>.value</code> 都落在同一个 ref 上 —— 多少组件解构、何时解构，都指向同一数据源（上方绿色卡片）。
        </li>
        <li>
          <strong>修复方式</strong>：不解构整体使用（基准面板写法）；或官方变通方案
          <code>reactive(useCounter())</code> 包裹后按属性访问；或
          <code>toRef(state, 'count')</code> 把单个属性转回 ref。
        </li>
      </ul>
    </SectionCard>

    <SectionCard :section="s.rules">
      <ul class="bullets">
        <li><strong>命名</strong>：驼峰命名、以 <code>use</code> 开头（<code>useFetch</code> / <code>useMouse</code>）。</li>
        <li>
          <strong>返回值</strong>：优先返回 <code>ref</code> 而非 <code>reactive</code> —— ref
          解构安全、多消费者一致；reactive 解构失联（上方红色卡片即翻车现场）。
        </li>
        <li>
          <strong>输入参数</strong>：用 <code>toValue()</code>（Vue 3.3+）统一兼容 普通值 / ref / getter；
          若内部建立响应式 effect，需在 <code>watchEffect</code> 内调用 <code>toValue</code> 才能追踪依赖。
        </li>
        <li>
          <strong>副作用</strong>：DOM 相关操作放 <code>onMounted</code>（仅浏览器执行，SSR 安全）；
          <code>onUnmounted</code> 中必须清理（如移除事件监听），防止内存泄漏。
        </li>
        <li>
          <strong>调用位置</strong>：只能在 <code>setup()</code> 中同步调用，否则关联不到生命周期钩子与响应式作用域。
        </li>
        <li>
          <strong>设计</strong>：单一职责、自包含，通过参数与返回值明确输入输出；
          需要跨组件共享时把状态提升到模块作用域（单例），更新收敛到导出的方法里。
        </li>
      </ul>
    </SectionCard>

    <SectionCard :section="s.impl">
      <p class="desc">
        数据源在 <code>src/composables/useCounter.js</code>：<code>count / double / increment / reset</code>
        定义在模块作用域（单例），任何组件调用得到的都是同一份；<code>useCounterRef()</code>
        原样返回 ref 集合，<code>useCounterReactive()</code> 仅多包一层 <code>reactive()</code>
        —— 变量隔离到唯一差异点。
      </p>
      <p class="desc">
        消费者组件 <code>src/components/CounterConsumer.vue</code> 用 <code>mode</code> prop
        切换消费姿势：<code>ref</code> / <code>reactive</code> 两种模式都执行同样的解构，
        <code>live</code> 模式整体持有不解构作基准。本页面通过「添加消费者」动态挂载新实例，
        验证不同时刻解构的快照差异；路由 <code>/composables</code> 见 <code>src/router/index.js</code>。
      </p>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { useCounterRef, useCounterReactive } from '@/composables/useCounter'
import CounterConsumer from '@/components/CounterConsumer.vue'
import SectionCard from '@/components/SectionCard.vue'
// 章节数据单一来源：卡片 header、侧边目录都由它构建
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

// ---- 正确写法区：多个消费者组件（ref + 解构，全部一致）----
const refConsumers = ref([
  { id: 1, label: '消费者 #1' },
  { id: 2, label: '消费者 #2' },
])
let refSeq = 2
function addRefConsumer() {
  refSeq += 1
  refConsumers.value.push({ id: refSeq, label: `消费者 #${refSeq}` })
}

// ---- 反例区：解构 reactive 的消费者（各自冻结在挂载瞬间的快照）----
const reactiveConsumers = ref([{ id: 1, label: '消费者 #1' }])
let reactiveSeq = 1
function addReactiveConsumer() {
  reactiveSeq += 1
  reactiveConsumers.value.push({ id: reactiveSeq, label: `消费者 #${reactiveSeq}` })
}

// 页面自身也是一个消费者：不解构、整体持有，作为"数据源真实状态"的对照
const liveState = useCounterReactive()
</script>

<style scoped>
.consumer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
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

.mini-table td:first-child {
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
</style>
<script>
// 章节数据单一来源：卡片 header 与侧边目录（router meta.toc，见 router/index.js）都由它构建
export const sections = [
  { key: 'scenarios', title: '适用场景：什么时候该抽组合式函数' },
  { key: 'shared-ref', title: '正确写法 · ref 返回值：多组件解构后依旧一致' },
  { key: 'shared-reactive', title: '反例 · reactive 返回值 + 解构：组件之间失联' },
  { key: 'why', title: '为什么反例会失联' },
  { key: 'rules', title: '官方约定速记' },
  { key: 'impl', title: '实现说明' },
]
</script>
