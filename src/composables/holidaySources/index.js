// 地区数据源注册表
// 契约：每个数据源默认导出 { id, label, loadYear(year) }，
// loadYear 归一化返回 Map<'YYYY-MM-DD', {name, isOffDay}>，失败 throw 即可（缓存层统一处理降级）
// 新增地区：新建 <id>.js 并在 SOURCES 注册，加工层（useHoliday）与 UI 自动生效
import cnSource from './cn'
import hkSource from './hk'

export const SOURCES = [cnSource, hkSource]

// 供 UI 渲染地区选择器
export const REGIONS = SOURCES.map(({ id, label }) => ({ value: id, label }))

export const getSource = (id) => SOURCES.find((s) => s.id === id)
