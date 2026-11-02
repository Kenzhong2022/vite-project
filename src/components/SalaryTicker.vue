<!--
  SalaryTicker：Tab 2 —— 实时工资
  - 日薪按本月实际工作日折算（countMonthWorkdays），配置持久化到 localStorage
  - 每秒 tick 驱动金额跳动；数字用 tabular-nums 防抖动
  - 金钱相关文字统一暖金色系，时间/加班用独立色区分维度
  - 框架三段式：.main-layout（左列 .col-left：.hero 实时概览 + .panel-config 配置；右列 .col-right：.panel-live 时间线+加班）→ .total-bar（今日总收获）
  - .money 金额拆成 .int 整数 + .decimal 小数，小数独立类名便于差异化样式
-->
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import dayjs from 'dayjs'
import { useChineseHolidays } from '@/composables/useChineseHolidays'
import { useSalary } from '@/composables/useSalary'

const STORAGE_KEY = 'redeem-salary-settings'

const { loadYear, yearMaps } = useChineseHolidays()
const now = ref(new Date())
let timer = null

onMounted(() => {
  loadYear(now.value.getFullYear())
  timer = setInterval(() => (now.value = new Date()), 1000)
})

onUnmounted(() => clearInterval(timer))

// 配置：默认值 → localStorage 恢复 → 变更持久化
const DEFAULTS = {
  monthlySalary: 10000,
  workStart: '09:00',
  workEnd: '18:00',
  overtimeHours: 0,
  overtimeIncome: 0,
}
const settings = reactive({ ...DEFAULTS, ...readStorage() })

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

watch(settings, (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true })

const {
  isWorkdayToday,
  workDaysThisMonth,
  dailySalary,
  earnedSalary,
  overtimeRate,
  overtimeIncome,
  todayIncome,
  remainingSeconds,
  progress,
} = useSalary(now, settings, yearMaps)

// 进度条颜色：金色，呼应金额
const progressColor = '#e6a23c'

// 上下班时间线：上班 → 此刻（高亮，带倒计时）→ 下班；已过节点实心，未到节点空心
const dayTimeline = computed(() => {
  const n = dayjs(now.value)
  const [sh, sm] = settings.workStart.split(':').map(Number)
  const [eh, em] = settings.workEnd.split(':').map(Number)
  const startPassed = n.valueOf() >= n.startOf('day').hour(sh).minute(sm).valueOf()
  const endPassed = n.valueOf() >= n.startOf('day').hour(eh).minute(em).valueOf()
  return [
    {
      timestamp: `${settings.workStart} 上班`,
      type: startPassed ? 'success' : 'primary',
      hollow: !startPassed,
      content: startPassed ? '已打卡' : '待打卡',
    },
    {
      timestamp: `${n.format('HH:mm:ss')} 此刻`,
      type: 'warning',
      content: isWorkdayToday.value ? `距下班 ${fmtDuration(remainingSeconds.value)}` : '今天休息',
    },
    {
      timestamp: `${settings.workEnd} 下班`,
      type: 'primary',
      hollow: !endPassed,
      content: endPassed ? '已下班' : '待解锁',
    },
  ]
})

// 金额拆分：整数（千分位）+ 小数两位，小数部分用 .decimal 单独渲染
function moneyParts(n) {
  const [int, dec] = n
    .toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split('.')
  return { int, dec }
}

function fmtMoney(n) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDuration(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
</script>

<template>
  <div class="salary-ticker">
    <el-alert
      v-if="!isWorkdayToday"
      title="今天不上班，进账暂停，好好休息"
      type="success"
      :closable="false"
      class="rest-alert"
    />

    <!-- 主区：左右布局 —— 左列（实时概览 → 配置）上下排布，右列（时间线 + 加班） -->
    <section class="main-layout">
      <div class="col-left">
        <!-- 左列上：实时概览 —— 大金额 / 折算说明 / 进度条 -->
        <section class="hero">
          <div class="main-stat">
            <span class="label">今日已赚</span>
            <span class="money">
              <span class="currency">¥</span
              ><span class="int">{{ moneyParts(earnedSalary).int }}</span
              ><span class="decimal">.{{ moneyParts(earnedSalary).dec }}</span>
            </span>
          </div>

          <div class="sub-stat">
            日薪 <b class="num-salary">¥ {{ fmtMoney(dailySalary) }}</b> &nbsp 按本月
            <b class="num-days">{{ workDaysThisMonth }}</b> 个工作日折算
          </div>

          <el-progress
            :percentage="Math.round(progress * 10000) / 100"
            :stroke-width="10"
            :color="progressColor"
            class="progress"
          />
        </section>

        <!-- 左列下：配置 -->
        <div class="panels-card panel-config">
          <el-form label-width="auto" label-position="top">
            <el-form-item label="月薪">
              <el-input-number v-model="settings.monthlySalary" :min="0" :step="1000" />
            </el-form-item>
            <el-form-item label="上班时间">
              <el-time-select
                v-model="settings.workStart"
                start="00:00"
                end="23:30"
                step="00:30"
                :clearable="false"
              />
            </el-form-item>
            <el-form-item label="下班时间">
              <el-time-select
                v-model="settings.workEnd"
                start="00:00"
                end="23:30"
                step="00:30"
                :clearable="false"
              />
            </el-form-item>
            <el-form-item label="今日加班（h）">
              <el-input-number v-model="settings.overtimeHours" :min="0" :max="24" :step="0.5" />
            </el-form-item>
            <el-form-item label="加班总收入（¥）">
              <el-input-number v-model="settings.overtimeIncome" :min="0" :step="50" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 右列：时间线 + 加班 -->
      <div class="panels-card panel-live col-right">
        <div class="panel-rows">
          <!-- 上下班时间线：此刻节点带倒计时 -->
          <div class="timeline-row">
            <el-timeline class="day-timeline">
              <el-timeline-item
                v-for="item in dayTimeline"
                :key="item.timestamp"
                :timestamp="item.timestamp"
                :type="item.type"
                :hollow="item.hollow"
              >
                {{ item.content }}
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="overtime-row">
            加班时长 <b class="num-overtime">{{ settings.overtimeHours }}</b> h &nbsp 折算时薪
            <b class="num-ot-money">¥ {{ fmtMoney(overtimeRate) }}</b
            >/h &nbsp 额外收入
            <b class="num-ot-money">¥ {{ fmtMoney(overtimeIncome) }}</b>
          </div>
        </div>
      </div>
    </section>

    <!-- 框架区 3：底部合计 -->
    <footer class="total-bar">
      <span>今日总收获</span>
      <span class="money small">
        <span class="currency">¥</span><span class="int">{{ moneyParts(todayIncome).int }}</span
        ><span class="decimal">.{{ moneyParts(todayIncome).dec }}</span>
      </span>
    </footer>
  </div>
</template>

<style scoped>
/* ============ 框架区 1：实时概览 ============ */
.hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-stat {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/* 主金额：金色渐变；.int 整数大字号，.decimal 小数缩小弱化 */
.money {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;

  /* 金色渐变文字，带纯色兜底 */
  color: #d4881a;
  background: linear-gradient(135deg, #f7c948 0%, #e0a800 45%, #b8860b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.money .currency {
  font-size: 0.6em;
  margin-right: 2px;
  font-weight: 600;
}

.money .decimal {
  font-size: 0.6em;
  font-weight: 600;
  opacity: 0.9;
}

.money.small {
  font-size: 24px;
}

/* 次级文字：日薪折算说明 */
.sub-stat {
  font-size: 13px;
  color: #6b7280;
}

/* 财务数字：暗金 */
.num-salary {
  color: #b45309;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.num-days {
  color: #b45309;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ============ 主区：左右布局 ============ */
.main-layout {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.col-left {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.col-right {
  flex: 2;
}

/* 简易容器（替代 el-card）：描边 + 圆角 + 内边距 */
.panels-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
}

.panel-rows {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
}

.panel-rows .timeline-row,
.panel-rows .overtime-row {
  width: 100%;
  font-size: 13px;
  color: #4b5563;
}

.panel-rows .timeline-row {
  flex: 1;
}

/* 上下班时间线 */
.day-timeline {
  padding-left: 4px;
  margin: 2px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

:deep(.el-timeline-item) {
  font-size: 25px;
  flex: 1;
}

.day-timeline :deep(.el-timeline-item__timestamp) {
  font-size: 25px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.day-timeline :deep(.el-timeline-item__content) {
  font-size: 25px;
  color: #4b5563;
  font-variant-numeric: tabular-nums;
}

/* 加班时长：橙 */
.num-overtime {
  color: #ea580c;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 加班收入：金 */
.num-ot-money {
  color: #c98a0e;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ============ 框架区 3：底部合计 ============ */
.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 12px;
  padding: 10px 8px;
  border-top: 1px solid sandybrown;
  font-size: 14px;
  font-weight: 600;
  color: #374151;

  /* 浅金底，强化"收获感" */
  background: linear-gradient(90deg, rgba(230, 162, 60, 0.08), transparent 70%);
  border-radius: 6px;
}

/* ============ 进度条 ============ */
.progress :deep(.el-progress__text) {
  font-variant-numeric: tabular-nums;
  color: #b45309;
  font-weight: 600;
}

.progress :deep(.el-progress-bar__outer) {
  background-color: #fdf3e0;
}
</style>
