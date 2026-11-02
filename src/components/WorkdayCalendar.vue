<!--
  WorkdayCalendar：Tab 1 —— 当月工作日日历
  - el-calendar 的 date-cell 插槽 data.day 就是 'YYYY-MM-DD' 字符串，直接作为 holiday-cn 映射的 key
  - 统计条按当前显示月份汇总：工作日 / 休息 / 法定假 / 调休上班
-->
<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { useChineseHolidays, getDayType } from '@/composables/useChineseHolidays'
import { useRestMode } from '@/composables/useRestMode'
import { useDevice } from '@/composables/useDevice'

const { loadYear, yearMaps, loading, unavailableYears } = useChineseHolidays()
const { restMode } = useRestMode()
const { isMobile } = useDevice() // 统计条两列布局用（复用全局断点，可被 localStorage 强制切换）
const currentDate = ref(new Date())

const year = computed(() => currentDate.value.getFullYear())
const month = computed(() => currentDate.value.getMonth() + 1)

// 当前查看的年份数据缺失（未来年份 holiday-cn 尚未发布，或本次拉取失败）
const yearDataMissing = computed(() => !!unavailableYears[year.value])

// 首次加载 / 跨年翻页时拉取对应年份数据
watch(year, (y) => loadYear(y), { immediate: true })

function cellInfo(dateStr) {
  return getDayType(dateStr, yearMaps, restMode.value)
}

const todayStr = () => dayjs().format('YYYY-MM-DD')

function cellClass(dateStr) {
  const { type } = cellInfo(dateStr)
  return [`is-${type}`, dateStr === todayStr() ? 'is-today' : '']
}

const stats = computed(() => {
  const y = year.value
  const m = month.value
  const days = new Date(y, m, 0).getDate()
  let workdays = 0
  let rest = 0
  let holidays = 0
  let makeups = 0
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const { type } = getDayType(ds, yearMaps, restMode.value)
    if (type === 'workday' || type === 'makeup') workdays++
    else rest++
    if (type === 'holiday') holidays++
    if (type === 'makeup') makeups++
  }
  return { workdays, rest, holidays, makeups }
})

function cellTextClass(dateStr) {
  const { type } = cellInfo(dateStr)
  return [`tag-${type}`]
}
</script>

<template>
  <div v-loading="loading" class="workday-calendar" :class="{ 'is-mobile': isMobile }">
    <el-alert
      v-if="yearDataMissing"
      :title="`${year} 年的假期数据尚未发布或加载失败，以下按周末规则估算（法定假 / 调休可能不准）`"
      type="warning"
      :closable="false"
      class="data-alert"
    />

    <!-- 统计条 -->
    <div class="stats">
      <span
        >本月工作日 <b>{{ stats.workdays }}</b> 天</span
      >
      <span :class="isMobile ? 'is-right' : ''"
        >休息 <b>{{ stats.rest }}</b> 天</span
      >
      <span
        >法定假 <b>{{ stats.holidays }}</b> 天</span
      >
      <span :class="isMobile ? 'is-right' : ''"
        >调休上班 <b>{{ stats.makeups }}</b> 天</span
      >
    </div>

    <el-calendar v-model="currentDate" class="calendar">
      <template #date-cell="{ data }">
        <div class="cell" :class="cellClass(data.day)">
          <span class="day-num">{{ Number(data.day.slice(-2)) }}</span>
          <span v-if="cellInfo(data.day).name" class="tag" :class="cellTextClass(data.day)">
            {{ cellInfo(data.day).name }}
          </span>
          <span v-if="cellInfo(data.day).type === 'makeup'" class="tag tag-makeup"> 调休上班 </span>
        </div>
      </template>
    </el-calendar>
  </div>
</template>

<style scoped lang="scss">
.workday-calendar {
  .stats {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--el-text-color-regular);

    b {
      color: var(--el-color-primary);
      font-variant-numeric: tabular-nums;
    }

    .is-right {
      text-align: right;
    }
  }

  /* 手机端：收窄为两列网格，避免横向溢出 */
  &.is-mobile .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
  }

  .calendar {
    height: 100%;
    :deep(.el-calendar__body) {
      padding: 0;
    }
  }
}

.data-alert {
  margin-bottom: 12px;
}

.cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.day-num {
  font-variant-numeric: tabular-nums;
}

.is-weekend .day-num {
  color: #94a3b8;
}

.is-holiday {
  background: #fef2f2;

  .day-num {
    color: #dc2626;
    font-weight: 600;
  }
}

.is-makeup {
  background: #fff7ed;
}

.tag {
  font-size: 10px;
  color: #dc2626;
  line-height: 1.4;
}

.tag-makeup {
  color: #ea580c;
}

.tag-workday {
  color: #26a646;
}

.tag-weekend {
  color: #94a3b8;
}

.is-today .day-num {
  background: #3b82f6;
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
