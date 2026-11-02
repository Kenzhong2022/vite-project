// hk 中国香港数据源
// 主源：Nager.Date（date.nager.at）—— 支持 CORS 直连、按年份接口、date 即 'YYYY-MM-DD'
// 兜底：1823.gov.hk 官方 iCal JSON（vcalendar 事件格式，无 CORS 头，需公共代理）
// 无调休概念：全为休假日（isOffDay: true）
import dayjs from 'dayjs'

// ---------- 主源：Nager.Date ----------
const nagerUrl = (year) => `https://date.nager.at/api/v3/publicholidays/${year}/HK`

async function loadNagerYear(year) {
  const res = await fetch(nagerUrl(year))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const list = await res.json()
  if (!Array.isArray(list) || list.length === 0) throw new Error('no data')
  const map = new Map()
  for (const item of list) {
    if (item.date) map.set(item.date, { name: item.localName || item.name, isOffDay: true })
  }
  return map
}

// ---------- 兜底源：1823.gov.hk ----------
// 特点：单文件全量数据（不分年份）、dtstart 'YYYYMMDD'、dtend 开区间、响应带 BOM
const HK1823_URL = 'https://www.1823.gov.hk/common/ical/tc.json'
// 直连（会被 CORS 拦截）→ 公共代理依次兜底
const HK1823_FETCHERS = [
  (url) => url,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

let hk1823EventsPromise = null // 全量事件列表的会话级缓存，切年份不重复请求

async function fetchHk1823Events() {
  if (hk1823EventsPromise) return hk1823EventsPromise
  hk1823EventsPromise = (async () => {
    let lastErr
    for (const wrap of HK1823_FETCHERS) {
      try {
        const res = await fetch(wrap(HK1823_URL))
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        // 去掉 BOM，否则 JSON.parse 报错
        const text = (await res.text()).replace(/^\uFEFF/, '')
        return JSON.parse(text).vcalendar?.[0]?.vevent ?? []
      } catch (e) {
        lastErr = e
      }
    }
    hk1823EventsPromise = null // 全部失败：清掉缓存的 promise，下次还能重试
    throw lastErr
  })()
  return hk1823EventsPromise
}

// vcalendar 事件 → 归一化年度映射：按年过滤 + dtend 区间逐日展开
async function load1823Year(year) {
  const events = await fetchHk1823Events()
  const y = String(year)
  const map = new Map()
  for (const ev of events) {
    const startRaw = ev.dtstart?.[0]
    if (!startRaw || !startRaw.startsWith(y)) continue
    const toDay = (s) => dayjs(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`)
    const start = toDay(startRaw)
    const endRaw = ev.dtend?.[0]
    const end = endRaw ? toDay(endRaw) : start.add(1, 'day')
    for (let d = start; d.isBefore(end); d = d.add(1, 'day')) {
      map.set(d.format('YYYY-MM-DD'), { name: ev.summary || '公众假期', isOffDay: true })
    }
  }
  if (map.size === 0) throw new Error('no data')
  return map
}

export default {
  id: 'hk',
  label: '中国香港',

  async loadYear(year) {
    try {
      return await loadNagerYear(year)
    } catch {
      return load1823Year(year) // 主源失败（接口波动/该年未收录）→ 官方源 + 代理兜底
    }
  },
}
