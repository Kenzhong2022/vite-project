<!--
  ImageCutout：图片抠图工具页
  - 消费 useImageCutout（@imgly/background-removal 浏览器本地推理，无服务端）
  - 用户路径：上传图片 → 自动抠图（含模型下载/推理进度）→ 预览对比 → 下载透明底 PNG
  - 纯工具页：路由 meta 不带 toc，不用 SectionCard
-->
<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { Download, RefreshRight, UploadFilled } from '@element-plus/icons-vue'
import { useImageCutout } from '@/composables/useImageCutout'

const { previewUrl, resultBlob, loading, progress, stage, error, cutout, preloadModel } =
  useImageCutout()

const fileInput = ref(null)
const sourceUrl = ref('') // 原图 ObjectURL，重选时回收
const dragOver = ref(false)

const stageText = {
  idle: '等待上传',
  downloading: '下载模型',
  processing: '抠图推理',
  done: '完成',
  error: '失败',
}

function pick() {
  fileInput.value?.click()
}

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
  sourceUrl.value = URL.createObjectURL(file)
  await cutout(file)
}

function onFileChange(e) {
  handleFile(e.target.files?.[0])
  e.target.value = '' // 清空 value，允许重复选择同一文件
}

function onDrop(e) {
  dragOver.value = false
  handleFile(e.dataTransfer?.files?.[0])
}

/** 结果下载：Blob → ObjectURL → a[download]，用完即回收 */
function download() {
  if (!resultBlob.value) return
  const url = URL.createObjectURL(resultBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `cutout-${Date.now()}.png`
  a.click()
  URL.revokeObjectURL(url)
}

/** 空闲时预热模型让首次抠图更快；失败静默 —— 正式抠图时会按需加载 */
onMounted(() => {
  preloadModel().catch(() => {})
  // HiDPI 防失真：缓冲区按 devicePixelRatio 放大，布局仍由 CSS 控制为逻辑 800×800
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  canvas.width = CANVAS_W * dpr
  canvas.height = CANVAS_H * dpr
  watchDpr()
})

/** DPR 实时监控：初始打印一次；此后每次变化（跨屏拖动/页面缩放）重新打印，递归重挂 matchMedia 监听 */
function watchDpr() {
  const dpr = window.devicePixelRatio || 1
  console.log(`[dpr] 当前 devicePixelRatio = ${dpr}`)
  matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
    'change',
    () => watchDpr(), // 旧查询已失效，DPR 变更后重新挂
    { once: true },
  )
}

// 长按结果图：浮出半透明幽灵预览图跟随指针（中心对齐）；拖到下方画布上松开则盖章绘制
const LONG_PRESS_MS = 500
const MOVE_CANCEL_PX = 10 // 触发前移动超过该距离视为滑动，取消长按
const GHOST_SIZE = 500
const CANVAS_W = 800 // 画布逻辑尺寸（CSS 布局用），内部缓冲区会再乘 DPR
const CANVAS_H = 800
const canvasRef = ref(null)
const ghostVisible = ref(false)
const ghostPos = reactive({ x: 0, y: 0 })
let longPressTimer = null
let pressStart = null

function startLongPress(e) {
  if (!previewUrl.value) return
  pressStart = { x: e.clientX, y: e.clientY }
  console.log(`[cutout] 按下 (${e.clientX}, ${e.clientY})，启动 ${LONG_PRESS_MS}ms 长按计时`)
  // 指针捕获：后续事件都定向到结果区元素，减少原生拖拽/滚动抢占 gesture
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    /* 部分环境 pointerId 已失效，忽略 */
  }
  // 跟随/松开监听挂 window：幽灵图可拖出结果区，到画布上松手盖章
  window.addEventListener('pointermove', onGhostMove)
  window.addEventListener('pointerup', endLongPress)
  window.addEventListener('pointercancel', endLongPress)
  longPressTimer = setTimeout(() => {
    longPressTimer = null
    ghostPos.x = e.clientX
    ghostPos.y = e.clientY
    ghostVisible.value = true
    console.log('[cutout] 长按触发 → 幽灵图出现，开始跟随')
  }, LONG_PRESS_MS)
}

function onGhostMove(e) {
  if (longPressTimer && pressStart) {
    // 未触发的长按期间大幅移动 → 判定为滑动，取消
    if (Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > MOVE_CANCEL_PX) {
      clearTimeout(longPressTimer)
      longPressTimer = null
      console.log(`[cutout] 触发前移动超 ${MOVE_CANCEL_PX}px → 判定滑动，取消长按`)
    }
    return
  }
  if (!ghostVisible.value) return
  ghostPos.x = e.clientX
  ghostPos.y = e.clientY
}

function endLongPress(e) {
  window.removeEventListener('pointermove', onGhostMove)
  window.removeEventListener('pointerup', endLongPress)
  window.removeEventListener('pointercancel', endLongPress)
  const wasGhost = ghostVisible.value
  if (longPressTimer) {
    console.log('[cutout] 提前松手，长按未触发')
    clearTimeout(longPressTimer)
  }
  longPressTimer = null
  pressStart = null
  if (wasGhost) {
    // pointercancel 坐标不可信（常为 0,0），统一用幽灵图的最后已知位置做命中测试
    console.log(
      `[cutout] 结束事件 ${e.type}（${e.pointerType}），以幽灵图末位 (${ghostPos.x}, ${ghostPos.y}) 结算`,
    )
    stampToCanvas()
  }
  ghostVisible.value = false
}

/** 松手盖章：以幽灵图末位为落点，命中画布才绘制；屏幕坐标 → 逻辑坐标 → ×DPR 进缓冲区，contain 缩进 GHOST_SIZE 内 */
function stampToCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !previewUrl.value) return
  const { x: cx, y: cy } = ghostPos
  const rect = canvas.getBoundingClientRect()
  const inside = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom
  console.log(
    `[cutout] 命中测试：落点 (${cx}, ${cy})，画布 ${Math.round(rect.left)},${Math.round(rect.top)} ~ ${Math.round(rect.right)},${Math.round(rect.bottom)} → ${inside ? '在画布内，盖章' : '不在画布内，跳过'}`,
  )
  if (!inside) return
  const img = new Image()
  img.onload = () => {
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // contain：等比缩进 GHOST_SIZE 盒子（逻辑坐标）
    const scale = Math.min(GHOST_SIZE / img.width, GHOST_SIZE / img.height)
    const w = img.width * scale
    const h = img.height * scale
    // 屏幕坐标 → 逻辑坐标（画布可能被 CSS 压缩），再 ×DPR → 缓冲区坐标
    const dpr = canvas.width / CANVAS_W
    const x = ((cx - rect.left) * CANVAS_W) / rect.width
    const y = ((cy - rect.top) * CANVAS_H) / rect.height
    ctx.drawImage(img, x * dpr - (w * dpr) / 2, y * dpr - (h * dpr) / 2, w * dpr, h * dpr)
    console.log(
      `[cutout] 已绘制：逻辑坐标 (${Math.round(x)}, ${Math.round(y)})，尺寸 ${Math.round(w)}×${Math.round(h)}，DPR ${dpr}（原图 ${img.width}×${img.height}）`,
    )
  }
  img.src = previewUrl.value
}

onUnmounted(endLongPress)
</script>

<template>
  <div class="page">
    <h1 class="page-title">图片抠图</h1>
    <p class="page-desc">
      基于 @imgly/background-removal
      在浏览器本地推理（首次使用需下载模型），上传图片自动去除背景，可下载透明底 PNG。
    </p>

    <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />

    <div class="cutout-stage">
      <div class="cutout-pane">
        <div class="cutout-pane-title">原图</div>
        <div
          class="cutout-drop"
          :class="{ 'is-drag': dragOver }"
          @click="pick"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <img v-if="sourceUrl" class="cutout-img" :src="sourceUrl" alt="原图" />
          <template v-else>
            <el-icon :size="32"><UploadFilled /></el-icon>
            <p class="desc">点击或拖拽图片到此处</p>
          </template>
        </div>
      </div>

      <div class="cutout-pane">
        <div class="cutout-pane-title">抠图结果</div>
        <div class="cutout-drop is-result" @pointerdown="startLongPress" @contextmenu.prevent>
          <img
            v-if="previewUrl"
            class="cutout-img"
            :src="previewUrl"
            alt="抠图结果"
            draggable="false"
          />
          <p v-else-if="loading" class="desc">{{ stageText[stage] }}中… {{ progress }}%</p>
          <p v-else-if="error" class="desc">出错了：{{ error.message }}</p>
          <p v-else class="desc">结果预览（透明底），长按可浮出预览</p>
        </div>
      </div>
    </div>

    <div class="cutout-actions">
      <el-progress v-if="loading" class="cutout-progress" :percentage="progress" />
      <span class="cutout-status">{{ stageText[stage] }}</span>
      <el-button :disabled="loading" @click="pick">
        <el-icon><RefreshRight /></el-icon>
        重新上传
      </el-button>
      <el-button type="primary" :disabled="!resultBlob" @click="download">
        <el-icon><Download /></el-icon>
        下载 PNG
      </el-button>
    </div>

    <!-- 盖章画布：长按结果图拖到此处松开，图案落在松手点（可叠加多个） -->
    <div class="cutout-canvas-wrap">
      <div class="cutout-pane-title">盖章画布 —— 长按结果图拖到此处松手即可盖章</div>
      <canvas ref="canvasRef" class="cutout-canvas"></canvas>
    </div>

    <!-- 长按浮出的幽灵预览：fixed 跟随指针，中心点修正靠 translate(-50%,-50%) -->
    <div
      v-if="ghostVisible"
      class="cutout-ghost"
      :style="{
        left: `${ghostPos.x}px`,
        top: `${ghostPos.y}px`,
        width: `${GHOST_SIZE}px`,
        height: `${GHOST_SIZE}px`,
        backgroundImage: `url(${previewUrl})`,
      }"
    />
  </div>
</template>

<style scoped>
.cutout-stage {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.cutout-pane {
  flex: 1;
  min-width: 0;
}

.cutout-pane-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.cutout-drop {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: border-color 0.15s;
}

.cutout-drop.is-drag {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

/* 结果面板只读；棋盘格衬托透明底 PNG 的透明区域；禁触摸滚动保证长按期间 pointer 事件不中断 */
.cutout-drop.is-result {
  cursor: default;
  touch-action: none;
  /* 掐掉 pointercancel 源头：文本选中、iOS 长按呼出菜单 */
  user-select: none;
  -webkit-touch-callout: none;
  background: repeating-conic-gradient(
      var(--el-fill-color-light) 0% 25%,
      var(--el-fill-color-lighter) 0% 50%
    )
    0 0 / 16px 16px;

  /* 禁原生图片拖拽（鼠标按住图片移动会触发 dragstart 抢占 pointer 流） */
  .cutout-img {
    -webkit-user-drag: none;
  }
}

.cutout-ghost {
  position: fixed;
  z-index: 9999;
  opacity: 0.5;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
  transform: translate(-50%, -50%); /* 中心点修正：跟随点落在元素中心 */
}

.cutout-canvas-wrap {
  margin-top: 16px;
}

/* 布局尺寸钉在逻辑 800×800（缓冲区是它的 DPR 倍），窄屏等比压缩 */
.cutout-canvas {
  display: block;
  width: min(100%, 800px);
  height: auto;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: repeating-conic-gradient(
      var(--el-fill-color-light) 0% 25%,
      var(--el-fill-color-lighter) 0% 50%
    )
    0 0 / 16px 16px;
}

.cutout-img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}

.cutout-actions {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cutout-progress {
  flex: 1;
}

.cutout-status {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
