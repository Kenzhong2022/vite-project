<!--
  ImageCutout：图片抠图工具页
  - 消费 useImageCutout（@imgly/background-removal 浏览器本地推理，无服务端）
  - 用户路径：上传图片 → 自动抠图（含模型下载/推理进度）→ 预览对比 → 下载透明底 PNG
  - 纯工具页：路由 meta 不带 toc，不用 SectionCard
-->
<script setup>
import { onMounted, ref } from 'vue'
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
})
</script>

<template>
  <div class="page">
    <h1 class="page-title">图片抠图</h1>
    <p class="page-desc">
      基于 @imgly/background-removal 在浏览器本地推理（首次使用需下载模型），上传图片自动去除背景，可下载透明底
      PNG。
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
        <div class="cutout-drop is-result">
          <img v-if="previewUrl" class="cutout-img" :src="previewUrl" alt="抠图结果" />
          <p v-else-if="loading" class="desc">{{ stageText[stage] }}中… {{ progress }}%</p>
          <p v-else-if="error" class="desc">出错了：{{ error.message }}</p>
          <p v-else class="desc">结果预览（透明底）</p>
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

/* 结果面板只读；棋盘格衬托透明底 PNG 的透明区域 */
.cutout-drop.is-result {
  cursor: default;
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
