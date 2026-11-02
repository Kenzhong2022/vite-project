<!--
  SalaryTicker：Tab 2 —— 实时工资（布局壳 + 数据层）
  - 日薪按本月实际工作日折算（countMonthWorkdays），配置持久化到 localStorage
  - 每秒 tick 驱动金额跳动；数字用 tabular-nums 防抖动
  - 金钱相关文字统一暖金色系，时间/加班用独立色区分维度
  - 布局：桌面 .main-layout 左右两列（左：.hero + 配置；右：时间线面板）→ .total-bar
    移动端（useDevice.isMobile）：hero 与时间线面板从上到下堆叠，配置收进按钮 + el-drawer
  - 内容已抽离：SalaryConfigForm（配置表单）/ SalaryLivePanel（时间线+加班），本组件只管数据与布局
  - .money 金额拆成 .int 整数 + .decimal 小数，小数独立类名便于差异化样式
-->
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import dayjs from 'dayjs'
import { Setting } from '@element-plus/icons-vue'
import { useHoliday } from '@/composables/useHoliday'
import { useSalary } from '@/composables/useSalary'
import { useDevice } from '@/composables/useDevice'
import SalaryConfigForm from '@/components/SalaryConfigForm.vue'
import SalaryLivePanel from '@/components/SalaryLivePanel.vue'

const STORAGE_KEY = 'redeem-salary-settings'

const { loadYear, yearMaps, region } = useHoliday()
const { isMobile } = useDevice()
const now = ref(new Date())
const configDrawer = ref(false) // 移动端配置抽屉
let timer = null

onMounted(() => {
  loadYear(now.value.getFullYear())
  timer = setInterval(() => (now.value = new Date()), 1000)
})

// 切地区：拉取当年新地区数据，workDaysThisMonth / isWorkdayToday 的 computed 会自动重算
watch(region, () => loadYear(now.value.getFullYear()))

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

    <!-- 主区：桌面左右两列（左列 hero 上 + 配置下）；移动端改上下堆叠 -->
    <section class="main-layout" :class="{ 'is-mobile-stacked': isMobile }">
      <div class="col-left">
        <!-- 实时概览 —— 大金额 / 折算说明 / 进度条 -->
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

        <!-- 配置：仅桌面端嵌在左列下方；移动端收进下方抽屉 -->
        <div v-if="!isMobile" class="panels-card panel-config">
          <SalaryConfigForm :settings="settings" />
        </div>
      </div>

      <!-- 时间线 + 加班：桌面为右列，移动端堆叠在 hero 下方 -->
      <div class="panels-card panel-live col-right">
        <SalaryLivePanel
          :timeline="dayTimeline"
          :overtime-hours="settings.overtimeHours"
          :overtime-rate="overtimeRate"
          :overtime-income="overtimeIncome"
        />
      </div>
    </section>

    <!-- 移动端：配置入口按钮 + 抽屉 -->
    <el-button
      v-if="isMobile"
      class="config-trigger"
      :icon="Setting"
      @click="configDrawer = true"
    >
      工资配置
    </el-button>
    <el-drawer v-if="isMobile" v-model="configDrawer" title="工资配置" direction="rtl" size="85%">
      <SalaryConfigForm :settings="settings" />
    </el-drawer>

    <!-- 底部合计 -->
    <footer class="total-bar">
      <span>今日总收获</span>
      <span class="money small">
        <span class="currency">¥</span><span class="int">{{ moneyParts(todayIncome).int }}</span
        ><span class="decimal">.{{ moneyParts(todayIncome).dec }}</span>
      </span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
/* ============ 实时概览 ============ */
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

  .currency {
    font-size: 0.6em;
    margin-right: 2px;
    font-weight: 600;
  }

  .decimal {
    font-size: 0.6em;
    font-weight: 600;
    opacity: 0.9;
  }

  &.small {
    font-size: 24px;
  }
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

/* ============ 主区：桌面左右两列 / 移动端上下堆叠 ============ */
.main-layout {
  display: flex;
  align-items: stretch;
  gap: 12px;

  /* 移动端：hero → 时间线面板 从上到下 */
  &.is-mobile-stacked {
    flex-direction: column;
  }
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

.is-mobile-stacked {
  .col-left,
  .col-right {
    flex: none;
  }
}

/* 简易容器（替代 el-card）：描边 + 圆角 + 内边距 */
.panels-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
}

/* 移动端配置入口按钮 */
.config-trigger {
  width: 100%;
  margin-top: 12px;
}

/* ============ 底部合计 ============ */
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
.progress {
  :deep(.el-progress__text) {
    font-variant-numeric: tabular-nums;
    color: #b45309;
    font-weight: 600;
  }

  :deep(.el-progress-bar__outer) {
    background-color: #fdf3e0;
  }
}
</style>
