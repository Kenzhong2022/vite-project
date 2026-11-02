// 中国法定节假日数据层：拉取 holiday-cn（NateScarlet/holiday-cn）年度 JSON，
// 产出「日期 → 日类型」映射。消费方：WorkdayCalendar（看当月工作日）、SalaryTicker（算动态日薪）
// 关键规则：判定优先级 holiday-cn 数据 > 周末规则；makeup（调休上班）必须算工作日
// 日期解析统一走 dayjs（'YYYY-MM-DD' 按本地时区，避开 UTC 偏移导致差一天）
import dayjs from 'dayjs'
import { reactive, ref } from 'vue'
import { altWeekEpoch } from './useRestMode'

// 大小周（alternate）的奇偶纪元存放在 useRestMode（用户可校准）；
// 偶数序号 = 大周（双休），奇数序号 = 小周（单休），跨年连续交替
function weekIndex(dateStr) {
  return Math.floor(dayjs(dateStr).startOf('day').diff(dayjs(altWeekEpoch.value), 'day') / 7)
}

/**
 * 按星期规则判定休息日（降级路径，仅当 holiday-cn 无该日期数据时走到这里）
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} mode - 休班模式：double 双休 | single 单休 | alternate 大小周
 */
function fallbackDayType(dateStr, mode) {
  const dow = dayjs(dateStr).day()
  if (dow === 0) return { type: 'weekend', name: '周末' } // 周日所有模式都休息
  if (dow === 6) {
    // 周六：双休休；单休上班；大小周看当周奇偶
    const isBigWeek = weekIndex(dateStr) % 2 === 0
    const rest = mode === 'double' || (mode === 'alternate' && isBigWeek)
    return rest ? { type: 'weekend', name: '周末' } : { type: 'workday', name: '' }
  }
  return { type: 'workday', name: '' }
}

const cdnUrl = (year) => `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`

/**
 * 年度数据映射（year -> Map）
 * @type {Object<number, Map<string, {name, isOffDay}>>}
 */
const yearMaps = reactive({}) // year -> Map<'YYYY-MM-DD', {name, isOffDay}>
const loading = ref(false)
const unavailableYears = reactive({}) // 拉取失败/尚未发布的年份 -> true（如未来年份 404）
const fetchedYears = new Set()

/**
 * @param {number} year - 年份
 * @returns {Promise<Map<string, {name, isOffDay}>>} 年度数据映射（year -> Map）
 * @description 从 CDN 拉取 holiday-cn 数据，缓存到 localStorage
 */
async function loadYear(year) {
  if (fetchedYears.has(year)) return yearMaps[year]
  fetchedYears.add(year)
  loading.value = true
  try {
    // localStorage 缓存兜底 CDN 抖动：成功拉过一次后不再依赖网络
    let json
    const cached = localStorage.getItem(`holiday-cn:${year}`)
    if (cached) {
      json = JSON.parse(cached)
    } else {
      const res = await fetch(cdnUrl(year))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      json = await res.json()
      localStorage.setItem(`holiday-cn:${year}`, JSON.stringify(json))
    }
    const map = new Map()
    for (const d of json.days) map.set(d.date, d) // date: 'YYYY-MM-DD'
    yearMaps[year] = map
    delete unavailableYears[year] // 重试成功则摘掉缺数据标记
  } catch (e) {
    // 未来年份的数据 holiday-cn 尚未发布（404）：标记缺数据年份供 UI 提示，
    // 且不留在 fetchedYears 里 —— 用户切走再切回时自动重试（数据可能后来才发布）
    unavailableYears[year] = true
    fetchedYears.delete(year)
    yearMaps[year] = yearMaps[year] ?? new Map() // 降级：空 map，只按周末规则判定
  } finally {
    loading.value = false
  }
  return yearMaps[year]
}

/**
 * 日类型判定（核心）：holiday-cn 数据命中优先，否则按休班模式走星期规则
 * @param {string} dateStr - 日期字符串（YYYY-MM-DD）
 * @param {Map<string, {name, isOffDay}>} maps - 年度数据映射（year -> Map）
 * @param {string} mode - 休班模式：double 双休 | single 单休 | alternate 大小周
 * @returns {Object} 返回 { type, name }，type: 'workday' | 'weekend' | 'holiday' | 'makeup'
 * - workday：普通工作日
 * - weekend：休息日（按休班模式判定）
 * - makeup：调休上班日（isOffDay: false，落在周末但要上班 → 算工作日）
 * - holiday：法定休假日（isOffDay: true）
 */
export function getDayType(dateStr, maps, mode = 'double') {
  const info = maps[Number(dateStr.slice(0, 4))]?.get(dateStr)
  if (info) {
    return info.isOffDay
      ? { type: 'holiday', name: info.name }
      : { type: 'makeup', name: info.name }
  }
  return fallbackDayType(dateStr, mode)
}

/**
 * 是否为工作日（包括调休上班日）
 */
export function isWorkday(dateStr, maps, mode = 'double') {
  const { type } = getDayType(dateStr, maps, mode)
  return type === 'workday' || type === 'makeup'
}

/**
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 * @param {Map<string, {name, isOffDay}>} maps - 年度数据映射（year -> Map）
 * @returns {number} 当月工作日数（month 从 1 开始）
 * @description 计算指定年月的工作日数（包括调休上班日）
 */
export function countMonthWorkdays(year, month, maps, mode = 'double') {
  const days = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (isWorkday(ds, maps, mode)) count++
  }
  return count
}

export function useChineseHolidays() {
  return { loadYear, yearMaps, loading, unavailableYears }
}
