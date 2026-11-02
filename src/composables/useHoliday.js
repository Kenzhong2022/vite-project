// 假期数据加工层：地区切换 + 缓存 + 「日期 → 日类型」判定，供日历/工资两 Tab 共用
// 数据来源在 holidaySources/（每地区一个模块，注册即生效），本层不关心具体源
// 缓存键统一 `${region}:${year}`，切地区互不串数据
// 关键规则：判定优先级 地区数据 > 周末规则；makeup（调休上班，仅 cn 有）必须算工作日
// 日期解析统一走 dayjs（'YYYY-MM-DD' 按本地时区，避开 UTC 偏移导致差一天）
import dayjs from 'dayjs'
import { reactive, ref } from 'vue'
import { SOURCES, REGIONS, getSource } from './holidaySources'

export { REGIONS }

const REGION_KEY = 'holiday-region'

// 当前地区（模块级共享 ref：getDayType/countMonthWorkdays 的默认参数按调用时值取，
// 消费方的 computed 会自动追踪它，切地区后所有相关计算即时重算）
export const region = ref(localStorage.getItem(REGION_KEY) || SOURCES[0].id)

export function setRegion(r) {
  region.value = r
  localStorage.setItem(REGION_KEY, r)
}

// ---------- 大小周奇偶纪元（仅作用于周末规则的降级路径）----------
// 偶数序号 = 大周（双休），奇数序号 = 小周（单休）；锚点前的日期 floor 负数，奇偶性依然一致
const WEEK_PARITY_EPOCH = dayjs('2026-01-05')

function weekIndex(dateStr) {
  return Math.floor(dayjs(dateStr).startOf('day').diff(WEEK_PARITY_EPOCH, 'day') / 7)
}

/**
 * 按星期规则判定休息日（降级路径，仅当地区数据无该日期时走到这里）
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

// ---------- 缓存与加载 ----------
const yearMaps = reactive({}) // `${region}:${year}` -> Map<'YYYY-MM-DD', {name, isOffDay}>
const loading = ref(false)
const unavailableYears = reactive({}) // `${region}:${year}` -> true（拉取失败/尚未发布）
const fetchedYears = new Set() // `${region}:${year}`

const storageKey = (r, year) => `holiday-${r}:${year}`

/**
 * @param {number} year - 年份
 * @param {string} [r] - 地区 id，缺省取当前 region
 * @returns {Promise<Map<string, {name, isOffDay}>>} 年度数据映射
 * @description localStorage 缓存优先，miss 时调用地区源的 loadYear（源内部自行处理主/兜底源）
 */
async function loadYear(year, r = region.value) {
  const ck = `${r}:${year}`
  if (fetchedYears.has(ck)) return yearMaps[ck]
  fetchedYears.add(ck)
  loading.value = true
  try {
    let map
    const cached = localStorage.getItem(storageKey(r, year))
    if (cached) {
      const json = JSON.parse(cached)
      // 归一化存储为 entries 数组；兼容旧格式（raw holiday-cn JSON：{days: [...]}）
      map = Array.isArray(json)
        ? new Map(json)
        : new Map((json.days ?? []).map((d) => [d.date, d]))
    } else {
      map = await getSource(r).loadYear(year)
      localStorage.setItem(storageKey(r, year), JSON.stringify([...map]))
    }
    yearMaps[ck] = map
    delete unavailableYears[ck] // 重试成功则摘掉缺数据标记
  } catch {
    // 数据缺失（如未来年份未发布 404、源全挂）：标记供 UI 提示，
    // 且不留在 fetchedYears 里 —— 切走再切回时自动重试
    unavailableYears[ck] = true
    fetchedYears.delete(ck)
    yearMaps[ck] = yearMaps[ck] ?? new Map() // 降级：空 map，只按周末规则判定
  } finally {
    loading.value = false
  }
  return yearMaps[ck]
}

/**
 * 日类型判定（核心）：地区数据命中优先，否则按休班模式走星期规则
 * @param {string} dateStr - 日期字符串（YYYY-MM-DD）
 * @param {Map<string, {name, isOffDay}>} maps - 数据映射（键 `${region}:${year}`）
 * @param {string} mode - 休班模式：double 双休 | single 单休 | alternate 大小周
 * @param {string} [r] - 地区 id，缺省取当前 region
 * @returns {Object} 返回 { type, name }，type: 'workday' | 'weekend' | 'holiday' | 'makeup'
 * - workday：普通工作日
 * - weekend：休息日（按休班模式判定）
 * - makeup：调休上班日（仅 cn 有 → 算工作日）
 * - holiday：法定休假日
 */
export function getDayType(dateStr, maps, mode = 'double', r = region.value) {
  const info = maps[`${r}:${Number(dateStr.slice(0, 4))}`]?.get(dateStr)
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
export function isWorkday(dateStr, maps, mode = 'double', r = region.value) {
  const { type } = getDayType(dateStr, maps, mode, r)
  return type === 'workday' || type === 'makeup'
}

/**
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 * @param {Map<string, {name, isOffDay}>} maps - 数据映射（键 `${region}:${year}`）
 * @param {string} [mode] - 休班模式
 * @param {string} [r] - 地区 id，缺省取当前 region
 * @returns {number} 当月工作日数（month 从 1 开始）
 */
export function countMonthWorkdays(year, month, maps, mode = 'double', r = region.value) {
  const days = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (isWorkday(ds, maps, mode, r)) count++
  }
  return count
}

export function useHoliday() {
  return { loadYear, yearMaps, loading, unavailableYears, region, setRegion }
}
