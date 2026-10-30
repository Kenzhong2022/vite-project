// composables/useDevice.js
import { computed } from 'vue'
import { useMediaQuery, useLocalStorage } from '@vueuse/core'

/**
 * 设备类型判断组合式函数
 * @param {Object} options 配置项
 * @param {number} [options.mobileBreakpoint=768] 移动端最大宽度断点
 * @param {number} [options.tabletBreakpoint=1024] 平板端最大宽度断点
 * @param {number} [options.ssrWidth=1024] SSR 环境下的默认宽度
 */
export function useDevice(options = {}) {
  const { mobileBreakpoint = 768, tabletBreakpoint = 1024, ssrWidth = 1024 } = options

  // 1. 检测屏幕宽度 (基于 VueUse，自带响应式和 SSR 优化)
  const isMobileWidth = useMediaQuery(`(max-width: ${mobileBreakpoint - 1}px)`, { ssrWidth })
  const isTabletWidth = useMediaQuery(
    `(min-width: ${mobileBreakpoint}px) and (max-width: ${tabletBreakpoint - 1}px)`,
    { ssrWidth },
  )

  // 2. 检测输入设备能力
  // (pointer: coarse) 代表触屏，如手指；(pointer: fine) 代表精确指针，如鼠标
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')

  // 安全判断 window 对象，兼容 SSR
  const isTouchDevice =
    typeof window !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false

  // 3. 手动强制切换（使用 localStorage 持久化）
  // 可选值：'mobile' | 'tablet' | 'desktop' | 'auto'
  const forcedDevice = useLocalStorage('forced-device', 'auto')

  // 4. 核心逻辑：计算自动判定的设备类型
  const autoDevice = computed(() => {
    if (isMobileWidth.value) return 'mobile'
    if (isTabletWidth.value) return 'tablet'
    return 'desktop'
  })

  // 最终结果：如果手动指定了，优先级最高；否则使用自动判断
  const deviceType = computed(() => {
    if (forcedDevice.value !== 'auto') return forcedDevice.value
    return autoDevice.value
  })

  // 便捷布尔值（方便在模板中 v-if）
  const isMobile = computed(() => deviceType.value === 'mobile')
  const isTablet = computed(() => deviceType.value === 'tablet')
  const isDesktop = computed(() => deviceType.value === 'desktop')

  // 5. 返回状态与方法
  return {
    // 当前设备类型：'mobile' | 'tablet' | 'desktop'
    deviceType,
    // 布尔快捷方式
    isMobile,
    isTablet,
    isDesktop,
    // 是否为触屏设备
    isTouchDevice,
    // 手动强制切换设备模式（用于开发调试或用户偏好）
    setDevice: (device) => {
      forcedDevice.value = device
    },
    // 重置为自动检测
    resetDevice: () => {
      forcedDevice.value = 'auto'
    },
  }
}
