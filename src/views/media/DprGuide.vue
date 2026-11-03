<!--
  DprGuide：DPR（设备像素比）知识页
  - 叙事线：实时监测（活演示）→ 是什么（三套像素+公式）→ 什么会改变它
    → 场景一/二/三：公式三种解法（位图调样式 / canvas 调缓冲区 / 矢量同样适用）→ 例外场景
  - 归属 views/media/：源于图片抠图页 canvas HiDPI 失真问题的延伸
-->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import wcrImg from '@/assets/wcr.jpeg'
import lzmImg from '@/assets/lzm.png'

// ---- 实时 DPR 监测 ----
// matchMedia('(resolution: Xdppx)') 的 once 监听递归重挂：DPR 变化（跨屏拖动 / Ctrl±缩放 / 系统缩放）时自动感知
const dpr = ref(1)
const dprLog = ref([]) // [{ dpr, time, source }] 最近变化记录，最新的在前
let mql = null

const SOURCE_TEXT = {
  zoom: '页面缩放（Ctrl + / Ctrl -）',
  screen: '跨屏拖动 / 系统缩放',
}

function pushLog(source) {
  dprLog.value.unshift({
    dpr: window.devicePixelRatio || 1,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    source: source || '初始加载',
  })
  if (dprLog.value.length > 8) dprLog.value.pop()
}

function observeDpr() {
  dpr.value = window.devicePixelRatio || 1
  mql?.removeEventListener('change', onDprChange)
  mql = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
  mql.addEventListener('change', onDprChange)
}

// matchMedia 变化事件不带来源，只能按触发时机启发式判断（页面缩放时 innerWidth 同步变小）
function onDprChange() {
  const isZoom = window.innerWidth < window.outerWidth / (window.devicePixelRatio || 1)
  pushLog(isZoom ? 'zoom' : 'screen')
  observeDpr() // 旧查询已失效，按新 DPR 重新挂
}

onUnmounted(() => mql?.removeEventListener('change', onDprChange))

// ---- 第 5 节演示：位图像素不可变，只能调样式尺寸适配 DPR ----
// 公式反解：样式尺寸 = 原始尺寸 ÷ dpr 时，位图 1:1 铺满物理像素（最清晰）
const natural = ref({ w: 0, h: 0 }) // 图片位图原始尺寸
const styleW = ref(500) // 滑杆控制的样式宽度（CSS px）
let userTouched = false

const demand = computed(() => Math.round(styleW.value * dpr.value)) // 显示所需的物理像素宽
const verdict = computed(() => {
  const n = natural.value.w
  if (!n) return null
  if (Math.abs(demand.value - n) <= 1) return { type: 'perfect', text: '1:1 物理像素 —— 最清晰' }
  if (demand.value > n)
    return {
      type: 'up',
      text: `放大显示：需要 ${demand.value}px，位图只有 ${n}px —— 插值拉伸，失真`,
    }
  return { type: 'down', text: `缩小显示：位图 ${n}px 只需 ${demand.value}px —— 有冗余像素，清晰` }
})

/**
 * 第 5 节演示图源：lzm.png（462×616），位图不可变 → 滑杆调样式尺寸
 * 执行顺序：new Image → 挂 onload → 赋 src，函数同步返回；图片异步解码完成后才回调 onload，
 * 回调前页面以 natural.w=0、滑杆禁用的兜底态渲染。必须先挂 onload 再赋 src：
 * 缓存命中时加载极快，顺序反了可能错过 load 事件导致回调永不执行。
 */
function measureLzm() {
  const img = new Image()
  img.onload = () => {
    natural.value = { w: img.naturalWidth, h: img.naturalHeight }
    // 初始停在「最清晰点」：原始尺寸 ÷ dpr；用户拖过滑杆后不再打扰
    if (!userTouched) styleW.value = Math.round(img.naturalWidth / (window.devicePixelRatio || 1))
  }
  img.src = lzmImg
}

// ---- 第 6 节演示：图片进 canvas 后，canvas 自身就是位图——样式不动，调缓冲区适配 DPR ----
// 同一张图、同样式尺寸的两个 canvas：左缓冲区=样式（糊），右缓冲区=样式×dpr（清晰）
const CANVAS_STYLE_W = 240 // 两个 canvas 共用的样式宽度（CSS px），图 2000×2666 为 3:4 → 样式高 320
const CANVAS_STYLE_H = 320
const blurCanvasRef = ref(null)
const sharpCanvasRef = ref(null)
let demoImg = null

function drawDemoCanvases() {
  if (!demoImg) return
  // 左（错误示范）：缓冲区 = 样式尺寸，dpr>1 时被拉伸 → 糊
  const blur = blurCanvasRef.value
  blur.width = CANVAS_STYLE_W
  blur.height = CANVAS_STYLE_H
  const bctx = blur.getContext('2d')
  bctx.imageSmoothingQuality = 'high'
  bctx.drawImage(demoImg, 0, 0, CANVAS_STYLE_W, CANVAS_STYLE_H)
  // 右（正确）：缓冲区 = 样式 × dpr，1:1 物理像素 → 清晰
  const sharp = sharpCanvasRef.value
  sharp.width = CANVAS_STYLE_W * dpr.value
  sharp.height = CANVAS_STYLE_H * dpr.value
  const sctx = sharp.getContext('2d')
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(demoImg, 0, 0, sharp.width, sharp.height)
}

/** 第 6 节演示图源：wcr.jpeg（2000×2666），加载完成后绘制到对比 canvas（异步 onload，同 measureLzm） */
function loadWcr() {
  const img = new Image()
  img.onload = () => {
    demoImg = img
    drawDemoCanvases()
  }
  img.src = wcrImg
}

// dpr 变化（Ctrl±缩放/跨屏）→ 右侧缓冲区按新 dpr 重建；左侧不动，正好暴露失真随 dpr 加剧
watch(dpr, drawDemoCanvases)

// ---- 第 7 节演示：canvas 矢量绘制（画圆）同样受 DPR 影响——只有一个跟随 dpr 重绘 ----
// 失真不只属于图片：canvas 的矢量绘制按缓冲区分辨率光栅化，缓冲区不足时圆的
// 抗锯齿边缘同样被拉伸发糊。同一段绘制代码跑两遍，唯一变量是缓冲区尺寸。
const CIRCLE_STYLE = 200 // 圆画布的样式尺寸（正方形，CSS px）
const blurCircleRef = ref(null)
const sharpCircleRef = ref(null)

function drawCircles() {
  const draw = (canvas, buffer) => {
    canvas.width = buffer
    canvas.height = buffer
    const ctx = canvas.getContext('2d')
    const c = buffer / 2
    // 外环 + 内圆：两圈抗锯齿边缘，边缘糊不糊看得更清；线宽/半径按 buffer 等比，两图形状一致
    ctx.beginPath()
    ctx.arc(c, c, c * 0.88, 0, Math.PI * 2)
    ctx.strokeStyle = '#409eff'
    ctx.lineWidth = buffer * 0.04
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(c, c, c * 0.55, 0, Math.PI * 2)
    ctx.fillStyle = '#409eff'
    ctx.fill()
  }
  if (blurCircleRef.value) draw(blurCircleRef.value, CIRCLE_STYLE) // 错误：缓冲区 = 样式
  if (sharpCircleRef.value) draw(sharpCircleRef.value, CIRCLE_STYLE * dpr.value) // 正确：缓冲区 = 样式 × dpr
}

watch(dpr, drawCircles)

// 统一挂载：DPR 监测 + 第 5 节量图 + 第 6 节备图 + 第 7 节画圆，按序执行
onMounted(() => {
  pushLog()
  observeDpr()
  measureLzm()
  loadWcr()
  drawCircles()
})
</script>

<template>
  <div class="page">
    <h1 class="page-title">DPR 设备像素比</h1>
    <p class="page-desc">
      Device Pixel Ratio：物理像素与 CSS 像素的比值。页面视角里「屏幕有多密」的唯一事实来源，
      高分屏下 canvas 发糊、1px 边框消失、图片模糊，根源都在它。本页架子先立住，知识区块后续充实。
    </p>

    <!-- 实时监测：这个区块是能跑的演示 -->
    <div class="dpr-card">
      <div class="dpr-card-title">实时监测</div>
      <div class="dpr-now">
        <span class="dpr-now-value">{{ dpr.toFixed(2).replace(/\.?0+$/, '') }}</span>
        <span class="dpr-now-unit">物理像素 / CSS 像素</span>
      </div>
      <p class="dpr-hint">试试 Ctrl + 加号/减号缩放页面，或把窗口拖到另一台缩放不同的显示器</p>
      <div v-if="dprLog.length" class="dpr-log">
        <div v-for="(item, i) in dprLog" :key="i" class="dpr-log-row">
          <span class="dpr-log-time">{{ item.time }}</span>
          <span class="dpr-log-value">DPR → {{ item.dpr }}</span>
          <span class="dpr-log-source">{{ SOURCE_TEXT[item.source] || item.source }}</span>
        </div>
      </div>
    </div>

    <!-- 知识区块：占位架子，内容后续填充 -->
    <section class="dpr-topic">
      <h2 class="dpr-topic-title">1. 三套「像素」到底是什么</h2>
      <p class="dpr-topic-body">
        物理像素（屏幕真实点阵）、CSS 像素（布局用的逻辑单位）、位图像素（图片/canvas
        缓冲区的实际数据点）。 TODO：配一张对照表和示意图。
      </p>
      <div class="dpr-formula">
        <span class="dpr-formula-item is-result">原始尺寸</span>
        <span class="dpr-formula-op">=</span>
        <span class="dpr-formula-item">样式尺寸</span>
        <span class="dpr-formula-op">×</span>
        <span class="dpr-formula-item">缩放倍率</span>
      </div>
      <p class="dpr-formula-note">
        位图/缓冲区实际像素 = CSS 逻辑尺寸 × devicePixelRatio。canvas HiDPI、2x 图片资源等所有「逻辑
        vs 物理」换算都归结为这一条。
      </p>
    </section>

    <section class="dpr-topic">
      <h2 class="dpr-topic-title">2. 什么会改变 DPR：页面缩放、系统缩放、换屏幕，是同一件事</h2>
      <p class="dpr-topic-body">
        三者都不改变物理屏幕，只改变「一个 CSS 像素占几个物理像素」。浏览器缩放只影响当前标签页，系统缩放
        / 跨屏拖动影响所有页面——但对页面代码而言没有区别，都只体现为 devicePixelRatio 变化。
        顶部「实时监测」卡就是活演示：Ctrl±缩放或拖窗口到另一台显示器，日志会记下每次变化。
        TODO：数值对照表（100% / 125% / 150% 下的三列换算）。
      </p>
    </section>

    <!-- 场景一：位图不可变 → 反解公式调样式尺寸；滑杆演示（图：lzm.png） -->
    <section class="dpr-topic">
      <h2 class="dpr-topic-title">3. 场景一 · 位图不可变：反解公式，调样式尺寸</h2>
      <p class="dpr-topic-body">
        图片一旦生成，位图尺寸就固定了（本图
        {{ natural.w || '…' }}×{{ natural.h || '…' }}）。公式「原始 = 样式 ×
        倍率」里唯一可动的只剩样式尺寸：拖到 <strong>原始 ÷ dpr</strong> 时 1:1
        铺满物理像素最清晰；再往大拖，屏幕需要的物理像素超过位图存量，只能插值拉伸——这就是放大失真。
      </p>
      <div class="img-demo">
        <div class="img-demo-stage">
          <img
            class="img-demo-img"
            :src="lzmImg"
            alt="DPR 适配演示图"
            :style="{ width: `${styleW}px` }"
          />
        </div>
        <div class="img-demo-panel">
          <el-slider
            v-model="styleW"
            :min="100"
            :max="natural.w || 2000"
            :step="1"
            :disabled="!natural.w"
            @input="userTouched = true"
          />
          <div class="img-demo-rows">
            <div class="img-demo-row">
              <span class="img-demo-k">原始尺寸（不可变）</span>
              <span class="img-demo-v">{{ natural.w }}×{{ natural.h }}</span>
            </div>
            <div class="img-demo-row">
              <span class="img-demo-k">样式尺寸（可调）</span>
              <span class="img-demo-v">{{ styleW }}px</span>
            </div>
            <div class="img-demo-row">
              <span class="img-demo-k">样式 × dpr（需求）</span>
              <span class="img-demo-v">{{ demand }}px</span>
            </div>
            <div class="img-demo-verdict" :class="`is-${verdict?.type}`">{{ verdict?.text }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 场景二：canvas 自身就是位图——样式不动，调缓冲区（width/height = 样式 × dpr）适配 DPR -->
    <section class="dpr-topic">
      <h2 class="dpr-topic-title">4. 场景二 · 图片进 canvas：样式不动，调缓冲区</h2>
      <p class="dpr-topic-body">
        失真的根源：canvas 缓冲区按 HTML 属性尺寸（位图）建立，CSS 布局却按逻辑尺寸拉伸显示——
        DPR &gt; 1 时每个位图点被放大，必然发糊。图片画进 canvas 后，canvas 本身就是一张位图，
        公式里这次可动的是<strong>原始尺寸</strong>（width/height 缓冲区）：保持样式不变，
        缓冲区设为 <strong>样式 × dpr</strong>，位图 1:1 铺满物理像素，即不失真。
        下面两个 canvas 样式完全相同，只差缓冲区：
      </p>
      <div class="cv-demo">
        <figure class="cv-demo-item">
          <canvas
            ref="blurCanvasRef"
            class="cv-demo-canvas"
            :style="{ width: `${CANVAS_STYLE_W}px` }"
          ></canvas>
          <figcaption class="cv-demo-cap">
            <strong>错误：缓冲区 = 样式</strong>
            <span
              >{{ CANVAS_STYLE_W }}×{{ CANVAS_STYLE_H }}，dpr {{ dpr }} 时被拉伸 {{ dpr }} 倍 →
              糊</span
            >
          </figcaption>
        </figure>
        <figure class="cv-demo-item">
          <canvas
            ref="sharpCanvasRef"
            class="cv-demo-canvas"
            :style="{ width: `${CANVAS_STYLE_W}px` }"
          ></canvas>
          <figcaption class="cv-demo-cap">
            <strong>正确：缓冲区 = 样式 × dpr</strong>
            <span>{{ CANVAS_STYLE_W * dpr }}×{{ CANVAS_STYLE_H * dpr }}，1:1 物理像素 → 清晰</span>
          </figcaption>
        </figure>
      </div>
      <p class="dpr-formula-note">
        实战同款：图片抠图页（ImageCutout）的盖章画布就是这个模式——逻辑 800×800，缓冲区 800 ×
        dpr 见方（当前 {{ 800 * dpr }}×{{ 800 * dpr }}）。试 Ctrl±缩放：右侧随 dpr
        实时重建（watch dpr → 重设 width/height → 重绘），左侧不动——失真随 dpr 加剧，正是公式在起作用。
      </p>
    </section>

    <!-- 场景三：矢量绘制同样受 DPR 影响——两个 canvas 画同样的圆，一个缓冲区跟随 dpr，一个不跟 -->
    <section class="dpr-topic">
      <h2 class="dpr-topic-title">5. 场景三 · 矢量绘制也逃不掉：画一个圆对比</h2>
      <p class="dpr-topic-body">
        失真不只属于图片。canvas 的矢量绘制（arc / line / text）是按<strong>缓冲区分辨率</strong>光栅化的：
        缓冲区不足时，抗锯齿算出来的平滑边缘会被拉伸成糊边。下面两个 canvas
        跑的是<strong>同一段绘制代码</strong>，唯一变量是缓冲区尺寸——一个跟随 dpr 重建重绘，一个永远停在
        {{ CIRCLE_STYLE }}×{{ CIRCLE_STYLE }}：
      </p>
      <div class="cv-demo">
        <figure class="cv-demo-item">
          <canvas ref="blurCircleRef" class="cv-demo-canvas" :style="{ width: `${CIRCLE_STYLE}px` }"></canvas>
          <figcaption class="cv-demo-cap">
            <strong>不跟随：缓冲区固定 {{ CIRCLE_STYLE }}×{{ CIRCLE_STYLE }}</strong>
            <span>
              屏幕需求 = 样式 × dpr = {{ CIRCLE_STYLE * dpr }}×{{ CIRCLE_STYLE * dpr }}，
              位图只有 {{ CIRCLE_STYLE }}×{{ CIRCLE_STYLE }} —— 需求超出位图，插值拉伸 →
              <em>失真</em>
            </span>
          </figcaption>
        </figure>
        <figure class="cv-demo-item">
          <canvas ref="sharpCircleRef" class="cv-demo-canvas" :style="{ width: `${CIRCLE_STYLE}px` }"></canvas>
          <figcaption class="cv-demo-cap">
            <strong>跟随：缓冲区 = 样式 × dpr</strong>
            <span>
              缓冲区实时重建为 {{ CIRCLE_STYLE * dpr }}×{{ CIRCLE_STYLE * dpr }}（{{ CIRCLE_STYLE }} ×
              dpr {{ dpr }}）—— 需求 = 位图，1:1 物理像素 → <em>清晰</em>
            </span>
          </figcaption>
        </figure>
      </div>
      <p class="dpr-formula-note">
        试 Ctrl±缩放：右侧的圆会随 dpr 即时重绘（watch dpr → 重设缓冲区 → 重画），左侧纹丝不动。dpr
        拉得越高，两者差距越大——矢量图「天生无损」的前提，是按目标分辨率重新光栅化。
      </p>
    </section>

    <!-- 收尾：例外场景——公式不必 always 生效 -->
    <section class="dpr-topic">
      <h2 class="dpr-topic-title">6. 例外：这些场景不需要处理 DPR</h2>
      <p class="dpr-topic-body">
        公式不是教条，下面几种情况故意不乘 dpr 反而正确：导出位图（canvas 即产物，直接按目标分辨率画，
        没有二次拉伸）；像素风渲染（故意要放大后的颗粒感，配 image-rendering: pixelated）；
        性能敏感的大面积动画（dpr=3 意味着 9 倍像素填充量，可封顶 min(dpr, 2) 换流畅）。
        TODO：各场景补充可运行示例。
      </p>
    </section>
  </div>
</template>

<style scoped>
.dpr-card {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.dpr-card-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.dpr-now {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.dpr-now-value {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.dpr-now-unit {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dpr-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dpr-log {
  margin-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dpr-log-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.dpr-log-time {
  color: var(--el-text-color-secondary);
}

.dpr-log-value {
  font-weight: 600;
}

.dpr-log-source {
  color: var(--el-text-color-secondary);
}

.dpr-topic {
  margin-bottom: 20px;
}

.dpr-topic-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.dpr-topic-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

/* 公式展示条：等宽风格，结果项高亮 */
.dpr-formula {
  margin: 12px 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--el-font-family, monospace);
  font-weight: 600;
  font-size: 15px;
}

.dpr-formula-item {
  padding: 4px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.dpr-formula-item.is-result {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.dpr-formula-op {
  color: var(--el-text-color-secondary);
}

.dpr-formula-note {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 第 5 节滑杆演示：左图右控；stage 可横向滚动——样式尺寸超过视口本身就是演示的一部分 */
.img-demo {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.img-demo-stage {
  flex: 1;
  min-width: 0;
  max-height: 420px;
  overflow: auto;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.img-demo-img {
  display: block;
}

.img-demo-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.img-demo-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.img-demo-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.img-demo-k {
  color: var(--el-text-color-secondary);
}

.img-demo-v {
  font-weight: 600;
}

.img-demo-verdict {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}

.img-demo-verdict.is-perfect {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.img-demo-verdict.is-down {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.img-demo-verdict.is-up {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 第 6 节 canvas 对比：同样式尺寸并排，只差缓冲区 */
.cv-demo {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.cv-demo-item {
  margin: 0;
}

.cv-demo-canvas {
  display: block;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.cv-demo-cap {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  line-height: 1.6;

  strong {
    font-weight: 600;
  }

  span {
    color: var(--el-text-color-secondary);
  }

  /* 判定结论：失真红 / 清晰绿，与第 5 节 verdict 配色一致 */
  em {
    font-style: normal;
    font-weight: 600;
  }
}

.cv-demo-item:first-child .cv-demo-cap em {
  color: var(--el-color-danger);
}

.cv-demo-item:last-child .cv-demo-cap em {
  color: var(--el-color-success);
}
</style>
