import { onUnmounted, ref, shallowRef } from 'vue'
import { preload, removeBackground } from '@imgly/background-removal'

const DEFAULTS = {
  model: 'isnet_fp16', // 精度优先；体积敏感可换 'isnet_quint8'
  device: 'gpu', // 不支持时库内部自动回退 WASM
  outputFormat: 'image/png',
}

/**
 * 人像抠图组合式函数
 * 输入任意图片源，输出预览 URL + 结果 Blob，生命周期内自动回收 ObjectURL
 *
 * @param {object} options
 * @param {'isnet_fp16'|'isnet_quint8'|'isnet'} [options.model]
 * @param {'gpu'|'cpu'} [options.device]
 * @param {string} [options.outputFormat]
 */
export function useImageCutout(options = {}) {
  const config = { ...DEFAULTS, ...options }

  const previewUrl = ref('') // 可直接绑定到 <img :src>
  const resultBlob = shallowRef(null) // 供下载 composable 使用
  const loading = ref(false)
  const progress = ref(0) // 0–100
  const stage = ref('idle') // idle | downloading | processing | done | error
  const error = ref(null)

  let runId = 0 // 每次调用递增，用于丢弃过期结果
  let preloadPromise = null

  function revokePreview() {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }
  }

  /** 清空所有状态并回收 URL；正在进行的推理结果会被丢弃 */
  function reset() {
    runId++
    revokePreview()
    resultBlob.value = null
    loading.value = false
    progress.value = 0
    stage.value = 'idle'
    error.value = null
  }

  /** 语义化取消，等同 reset */
  const cancel = reset

  async function normalizeToBlob(input) {
    if (input instanceof Blob) return input

    if (typeof input === 'string') {
      const res = await fetch(input)
      if (!res.ok) throw new Error(`图片加载失败：HTTP ${res.status}`)
      return res.blob()
    }

    if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
      if (!input.complete || !input.naturalWidth) {
        await new Promise((resolve, reject) => {
          input.addEventListener('load', resolve, { once: true })
          input.addEventListener('error', () => reject(new Error('图片加载失败')), { once: true })
        })
      }
      return elementToBlob(input, input.naturalWidth, input.naturalHeight)
    }

    if (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) {
      return elementToBlob(input, input.width, input.height)
    }

    throw new Error(
      '不支持的图片输入类型：仅接受 Blob/File、URL 字符串、HTMLImageElement、HTMLCanvasElement',
    )
  }

  function elementToBlob(el, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(el, 0, 0, width, height)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob 返回空'))),
        'image/png',
      )
    })
  }

  /** 预热模型，建议在页面空闲时调用；失败后允许重试 */
  function preloadModel() {
    if (!preloadPromise) {
      preloadPromise = preload({ model: config.model, device: config.device }).catch((err) => {
        preloadPromise = null
        throw err
      })
    }
    return preloadPromise
  }

  /**
   * 执行抠图
   * @param {Blob|File|string|HTMLImageElement|HTMLCanvasElement} input
   * @returns {Promise<{blob: Blob, url: string} | null>} 被取消/失败时返回 null
   */
  async function cutout(input) {
    reset()
    const myRun = runId

    loading.value = true
    stage.value = 'downloading'

    try {
      const sourceBlob = await normalizeToBlob(input)
      if (myRun !== runId) return null

      const blob = await removeBackground(sourceBlob, {
        model: config.model,
        device: config.device,
        output: { format: config.outputFormat },
        progress: (key, current, total) => {
          if (myRun !== runId) return
          const pct = total > 0 ? Math.round((current / total) * 100) : 0
          progress.value = pct
          stage.value = key.startsWith('fetch') ? 'downloading' : 'processing'
        },
      })

      if (myRun !== runId) return null

      resultBlob.value = blob
      previewUrl.value = URL.createObjectURL(blob)
      progress.value = 100
      stage.value = 'done'
      return { blob, url: previewUrl.value }
    } catch (err) {
      if (myRun !== runId) return null
      error.value = err
      stage.value = 'error'
      console.error('[useImageCutout]', err)
      return null
    } finally {
      if (myRun === runId) loading.value = false
    }
  }

  // 组件卸载时清理：递增 runId 会让进行中的推理结果被丢弃，同时回收 URL
  onUnmounted(reset)

  return {
    previewUrl,
    resultBlob,
    loading,
    progress,
    stage,
    error,
    cutout,
    reset,
    cancel,
    preloadModel,
  }
}
