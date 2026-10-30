<!--
  PropsListItem：props 稳定性实验的被测子组件。
  onUpdated 上报"我被更新了"（父组件统计每轮更新了多少个实例）
-->
<script setup>
import { computed, onUpdated } from 'vue'

const props = defineProps({
  index: { type: Number, required: true },
  name: String,
  id: Number,
  // 结果透传模式使用：布尔结果，未启用时传 undefined（Object.is 相等，不引发更新）
  active: { type: Boolean, default: undefined },
  // 源头透传模式使用：高频变化的源头值
  activeId: { type: Number, default: undefined },
})
const emit = defineEmits(['bumped'])

const isActive = computed(() =>
  props.active !== undefined ? props.active : props.id === props.activeId,
)

onUpdated(() => emit('bumped', props.index))
</script>

<template>
  <div class="row" :class="{ 'is-active': isActive }">
    <span class="name">{{ name }}</span>
    <!-- 激活布尔值用 switch 展示：受控绑定 isActive，pointer-events 穿透让点击落到行上（仍走 props 更新） -->
    <el-switch size="small" :model-value="isActive" class="state-switch" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background 0.15s;
}

.row:hover {
  background: var(--el-fill-color-light);
}

.row.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.name {
  min-width: 70px;
}

.state-switch {
  pointer-events: none;
}
</style>
