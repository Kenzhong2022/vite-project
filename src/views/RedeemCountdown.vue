<!--
  RedeemCountdown：赎身倒计时页（页面壳：标题 + 休班模式 tag + 双 Tab）
  - 标题旁 tag 切换休班模式（双休/单休/大小周），useRestMode 模块级共享给两个 Tab
  - Tab 1 WorkdayCalendar「看」当月工作日，Tab 2 SalaryTicker「用」同一份数据算日薪
  - 页面壳预拉当年 holiday-cn 数据：工资 Tab 懒渲染，提前拉好避免切 Tab 才请求
-->
<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><Timer /></el-icon>
      赎身倒计时
      <span class="rest-mode-tags">
        <el-tag
          v-for="m in modes"
          :key="m.value"
          class="rest-mode-tag"
          :effect="restMode === m.value ? 'dark' : 'plain'"
          @click="restMode = m.value"
        >
          {{ m.label }}
        </el-tag>
      </span>
      <!-- 大小周相位校准：选一个双休周里的日期，该周即为大周，之后逐周交替 -->
      <template v-if="restMode === 'alternate'">
        <span class="alt-epoch-label">校准：选一个<b>双休周</b>里的日期，该周记为大周，之后逐周交替</span>
        <el-date-picker
          class="alt-epoch-picker"
          :model-value="altWeekEpoch"
          type="date"
          size="small"
          placeholder="选双休周里的任意日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @update:model-value="setAltWeekEpoch"
        />
      </template>
    </h1>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="本月工作日" name="calendar">
        <WorkdayCalendar />
      </el-tab-pane>
      <el-tab-pane label="实时工资" name="salary">
        <SalaryTicker />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import WorkdayCalendar from '@/components/WorkdayCalendar.vue'
import SalaryTicker from '@/components/SalaryTicker.vue'
import { useChineseHolidays } from '@/composables/useChineseHolidays'
import { useRestMode } from '@/composables/useRestMode'

const { loadYear } = useChineseHolidays()
const { restMode, modes, altWeekEpoch, setAltWeekEpoch } = useRestMode()

const activeTab = ref('calendar')

onMounted(() => loadYear(new Date().getFullYear()))
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rest-mode-tags {
  display: inline-flex;
  gap: 6px;
  margin-left: 8px;
}

.rest-mode-tag {
  cursor: pointer;
  user-select: none;
}

.alt-epoch-label {
  margin-left: 8px;
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.alt-epoch-label b {
  color: var(--el-color-primary);
  font-weight: 600;
}

.alt-epoch-picker {
  width: 200px;
}
</style>
