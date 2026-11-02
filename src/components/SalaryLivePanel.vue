<!--
  SalaryLivePanel：上下班时间线 + 加班收入（纯展示）
  - timeline 由父组件每秒重算后传入；加班数值由父组件从 useSalary 取出传入
  - 纯内容组件：外层容器（panels-card / 列宽）由父组件决定，桌面右列与移动端堆叠共用
-->
<script setup>
defineProps({
  timeline: { type: Array, required: true },
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  overtimeIncome: { type: Number, default: 0 },
})

function fmtMoney(n) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="live-rows">
    <!-- 上下班时间线：此刻节点带倒计时 -->
    <div class="timeline-row">
      <el-timeline class="day-timeline">
        <el-timeline-item
          v-for="item in timeline"
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
      加班时长 <b class="num-overtime">{{ overtimeHours }}</b> h &nbsp 折算时薪
      <b class="num-ot-money">¥ {{ fmtMoney(overtimeRate) }}</b
      >/h &nbsp 额外收入
      <b class="num-ot-money">¥ {{ fmtMoney(overtimeIncome) }}</b>
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-rows {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;

  .timeline-row,
  .overtime-row {
    width: 100%;
    font-size: 13px;
    color: #4b5563;
  }

  .timeline-row {
    flex: 1;
  }
}

/* 上下班时间线 */
.day-timeline {
  padding-left: 4px;
  margin: 2px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;

  :deep(.el-timeline-item) {
    font-size: 18px;
    flex: 1;
  }

  :deep(.el-timeline-item__timestamp) {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-variant-numeric: tabular-nums;
  }

  :deep(.el-timeline-item__content) {
    font-size: 25px;
    color: #4b5563;
    font-variant-numeric: tabular-nums;
  }
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
</style>
