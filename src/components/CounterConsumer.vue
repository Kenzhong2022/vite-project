<template>
  <div class="consumer" :class="cls">
    <div class="consumer-head">
      <span class="consumer-label">{{ label }}</span>
      <el-tag size="small" effect="light" :type="tagType">{{ tagText }}</el-tag>
    </div>
    <div class="consumer-body">
      <span class="metric"
        >count = <b>{{ live ? live.count : count }}</b></span
      >
      <span class="metric"
        >double = <b>{{ live ? live.double : double }}</b></span
      >
      <el-button size="small" type="primary" @click="increment">+1</el-button>
      <el-button size="small" @click="reset">重置</el-button>
    </div>
  </div>
</template>

<script setup>
import { useCounterRef, useCounterReactive } from '@/composables/useCounter'

const props = defineProps({
  // 三种消费姿势，数据源完全相同（同一份模块级单例）：
  // - ref：解构 ref 集合 → 拿到 ref 对象本身，始终连着数据源
  // - reactive：解构 reactive 对象 → 拿到解构那一刻的值拷贝，与数据源断开
  // - live：整体持有 reactive 代理、不解构 → 持续反映数据源真实状态（基准面板）
  mode: { type: String, default: 'ref' },
  label: { type: String, default: '' },
})

// 两种解构写法的"唯一差异点"就是这里调用哪个导出 —— 同样是解构：
// ref 解构拿到的是活着的 ref；reactive 解构拿到的是冻结在挂载瞬间的快照
let count, double, increment, reset
let live = null
if (props.mode === 'ref') {
  ;({ count, double, increment, reset } = useCounterRef())
} else if (props.mode === 'reactive') {
  ;({ count, double, increment, reset } = useCounterReactive())
} else {
  live = useCounterReactive()
  ;({ increment, reset } = live)
}

const cls = props.mode === 'ref' ? 'is-ref' : props.mode === 'live' ? 'is-live' : 'is-reactive'
const tagType = props.mode === 'ref' ? 'success' : props.mode === 'live' ? 'primary' : 'danger'
const tagText =
  props.mode === 'ref'
    ? 'ref + 解构 ✓'
    : props.mode === 'live'
      ? '整体访问（不解构）✓'
      : 'reactive + 解构 ✗'
</script>

<style scoped>
.consumer {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
}

.consumer.is-ref {
  border-left: 3px solid var(--el-color-success);
}

.consumer.is-live {
  border-left: 3px solid var(--el-color-primary);
}

.consumer.is-reactive {
  border-left: 3px solid var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.consumer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.consumer-label {
  font-size: 13px;
  font-weight: 600;
}

.consumer-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.metric {
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-text-color-regular);
}

.metric b {
  font-size: 15px;
}

.is-ref .metric b {
  color: var(--el-color-success);
}

.is-live .metric b {
  color: var(--el-color-primary);
}

/* 冻结的快照值：灰显，暗示它不再跟随数据源 */
.is-reactive .metric b {
  color: var(--el-text-color-secondary);
}
</style>
