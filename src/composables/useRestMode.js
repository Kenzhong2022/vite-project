// 休班模式：双休 / 单休 / 大小周。页面壳的 tag 可切换，日历与工资两个 Tab 共享同一状态。
// 只影响「无 holiday-cn 数据时按星期判定休息日」的降级规则，法定假/调休数据仍优先。
import { ref, watch } from 'vue'
import dayjs from 'dayjs'

const REST_MODE_KEY = 'off-work-rest-mode'
const ALT_EPOCH_KEY = 'off-work-alt-week-epoch'

export const REST_MODES = [
  { value: 'double', label: '双休' },
  { value: 'single', label: '单休' },
  { value: 'alternate', label: '大小周' },
]

// 模块级共享 ref：切 Tab / 跨组件保持同一模式，并持久化
const restMode = ref(localStorage.getItem(REST_MODE_KEY) || 'double')

watch(restMode, (v) => localStorage.setItem(REST_MODE_KEY, v))

// 大小周奇偶纪元（'YYYY-MM-DD' 的周一）：weekIndex = floor(距该周一的天数 / 7)，
// 对任意年份自洽。用户可校准相位 —— 选一个"双休周"里的日期，其所在周即为大周（序号 0）
export const altWeekEpoch = ref(localStorage.getItem(ALT_EPOCH_KEY) || '2026-01-05')

watch(altWeekEpoch, (v) => localStorage.setItem(ALT_EPOCH_KEY, v))

// 校准入口：把用户选的任意日期归到其所在周（周一起算）的周一，作为新纪元
function setAltWeekEpoch(dateStr) {
  const d = dayjs(dateStr)
  const dow = d.day()
  altWeekEpoch.value = d.add(dow === 0 ? -6 : 1 - dow, 'day').format('YYYY-MM-DD')
}

export function useRestMode() {
  return { restMode, modes: REST_MODES, altWeekEpoch, setAltWeekEpoch }
}
