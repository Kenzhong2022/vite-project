// cn 中国大陆数据源：holiday-cn（NateScarlet/holiday-cn）年度 JSON
// 含法定假（isOffDay: true）+ 调休（isOffDay: false），date 即 'YYYY-MM-DD'，直接入 Map
const cdnUrl = (year) => `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`

export default {
  id: 'cn',
  label: '中国大陆',

  async loadYear(year) {
    const res = await fetch(cdnUrl(year))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const map = new Map()
    for (const d of json.days) map.set(d.date, d)
    return map
  },
}
