import { watch } from 'vue'
import { useCssVar, useLocalStorage } from '@vueuse/core'

/** Element Plus 实际生成的色阶权重（与官方 SCSS 一致） */
const LIGHT_WEIGHTS = [3, 5, 7, 8, 9]
const DARK_WEIGHTS = [2]

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * 模拟 SCSS 的 mix($target, $color, $ratio)
 * light-N = mix(#fff, $color, N*10%)
 * dark-N  = mix(#000, $color, N*10%)
 */
function mix(color, target, ratio) {
  const { r, g, b } = hexToRgb(color)
  const t = target === 'white' ? 255 : 0
  const mixR = Math.round(r * (1 - ratio) + t * ratio)
  const mixG = Math.round(g * (1 - ratio) + t * ratio)
  const mixB = Math.round(b * (1 - ratio) + t * ratio)
  return rgbToHex(mixR, mixG, mixB)
}

export function useElementTheme(initialColor = '#409EFF') {
  // 持久化用户选择
  const storedColor = useLocalStorage('el-theme-primary', initialColor)

  // 用 useCssVar 绑定基础色变量（双向响应）
  const primaryColor = useCssVar('--el-color-primary', document.documentElement)

  // 初始化
  primaryColor.value = storedColor.value

  // 基础色变化时，同步所有衍生色阶
  watch(
    primaryColor,
    (color) => {
      if (!color) return
      storedColor.value = color

      const root = document.documentElement
      const { r, g, b } = hexToRgb(color)

      // 基础色 + RGB 变量
      root.style.setProperty('--el-color-primary', color)
      root.style.setProperty('--el-color-primary-rgb', `${r}, ${g}, ${b}`)

      // light-3/5/7/8/9
      LIGHT_WEIGHTS.forEach((w) => {
        root.style.setProperty(`--el-color-primary-light-${w}`, mix(color, 'white', w / 10))
      })

      // dark-2
      DARK_WEIGHTS.forEach((w) => {
        root.style.setProperty(`--el-color-primary-dark-${w}`, mix(color, 'black', w / 10))
      })
    },
    { immediate: true },
  )

  return { primaryColor }
}
