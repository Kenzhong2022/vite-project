// 工资实时计算：月薪按当月实际工作日折算日薪（替代写死的 22 天），
// 再按秒推进「今日已赚 / 下班倒计时 / 进度」。now 是每秒更新的 ref，settings 为表单配置。
// 日期运算统一走 dayjs（本地时区）；依赖 useHoliday 的 yearMaps 判定工作日
import dayjs from 'dayjs'
import { computed } from 'vue'
import { getDayType, countMonthWorkdays } from './useHoliday'
import { useRestMode } from './useRestMode'

/**
 * 获取指定时间的 dayjs 时刻
 * @param {*} day 日期对象
 * @param {*} hm 时间字符串，格式 'HH:mm'
 * @returns dayjs 时刻对象
 */
function atTime(day, hm) {
  const [h, m] = hm.split(':').map(Number)
  return day.hour(h).minute(m).second(0).millisecond(0)
}

export function useSalary(now, settings, yearMaps) {
  const { restMode } = useRestMode()

  // 今天是否上班日（含调休 makeup；数据未就绪时按休班模式走星期规则）
  const isWorkdayToday = computed(() => {
    const { type } = getDayType(dayjs(now.value).format('YYYY-MM-DD'), yearMaps, restMode.value)
    return type === 'workday' || type === 'makeup'
  })

  // 本月实际工作日数；极端情况下兜底 22
  const workDaysThisMonth = computed(() => {
    const n = now.value
    return countMonthWorkdays(n.getFullYear(), n.getMonth() + 1, yearMaps, restMode.value) || 22
  })

  const workStartAt = computed(() => atTime(dayjs(now.value).startOf('day'), settings.workStart))
  const workEndAt = computed(() => atTime(dayjs(now.value).startOf('day'), settings.workEnd))
  const workSeconds = computed(() =>
    Math.max(workEndAt.value.diff(workStartAt.value, 'second'), 60),
  )

  const dailySalary = computed(() => settings.monthlySalary / workDaysThisMonth.value)
  const perSecond = computed(() => dailySalary.value / workSeconds.value)

  // 今天已过的工作时间（秒）：未上班为 0，下班后封顶为全天时长
  const elapsedSeconds = computed(() => {
    if (!isWorkdayToday.value) return 0
    const elapsed = dayjs(now.value).diff(workStartAt.value, 'second')
    return Math.min(Math.max(elapsed, 0), workSeconds.value)
  })

  const earnedSalary = computed(() => elapsedSeconds.value * perSecond.value)

  // 加班：时长 + 总收入均为配置项，额外收入即配置的总收入；
  // 加班时薪由二者计算得出（时长为 0 时不折算）
  const overtimeRate = computed(() =>
    settings.overtimeHours > 0 ? settings.overtimeIncome / settings.overtimeHours : 0,
  )

  const overtimeIncome = computed(() => (isWorkdayToday.value ? settings.overtimeIncome : 0))

  const todayIncome = computed(() => earnedSalary.value + overtimeIncome.value)

  const remainingSeconds = computed(() =>
    Math.max(workEndAt.value.diff(dayjs(now.value), 'second'), 0),
  )

  const progress = computed(() => elapsedSeconds.value / workSeconds.value)

  return {
    isWorkdayToday,
    workDaysThisMonth,
    dailySalary,
    earnedSalary,
    overtimeRate,
    overtimeIncome,
    todayIncome,
    remainingSeconds,
    progress,
  }
}
