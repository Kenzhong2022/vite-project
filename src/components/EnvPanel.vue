<script setup>
import { ref, computed } from 'vue'

defineProps({
  /** 距离下一次版本检查的秒数（由 App.vue 的轮询计时器驱动，PROD 下有意义） */
  remaining: { type: Number, required: true },
})

const expanded = ref(false)

const isProd = import.meta.env.PROD

const envInfo = computed(() => ({
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  SSR: import.meta.env.SSR,
}))
</script>

<template>
  <div class="env-panel" :class="{ expanded }" @click="expanded = !expanded">
    <div v-if="!expanded" class="env-panel-collapsed">
      <el-tag :type="isProd ? 'warning' : 'success'" size="small" effect="plain">
        {{ isProd ? 'PROD' : 'DEV' }}
      </el-tag>
      <span v-if="isProd" class="env-panel-tick">{{ remaining }}s</span>
      <span v-else class="env-panel-hint">展开</span>
    </div>

    <div v-else class="env-panel-expanded" @click.stop>
      <div class="env-panel-header">
        <span>环境信息</span>
        <el-button link size="small" @click="expanded = false">收起</el-button>
      </div>
      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="MODE">{{ envInfo.MODE }}</el-descriptions-item>
        <el-descriptions-item label="BASE_URL">{{ envInfo.BASE_URL }}</el-descriptions-item>
        <el-descriptions-item label="PROD">{{ envInfo.PROD }}</el-descriptions-item>
        <el-descriptions-item label="DEV">{{ envInfo.DEV }}</el-descriptions-item>
        <el-descriptions-item label="SSR">{{ envInfo.SSR }}</el-descriptions-item>
        <el-descriptions-item v-if="isProd" label="下一次检查"
          >{{ remaining }}s</el-descriptions-item
        >
      </el-descriptions>
    </div>
  </div>
</template>

<style scoped>
.env-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  cursor: pointer;
  user-select: none;
}

.env-panel-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  filter: drop-shadow(0 0 3px var(--el-color-primary-light-9));
}

.env-panel-collapsed:hover {
  color: var(--el-color-primary);
  filter: drop-shadow(0 0 3px var(--el-color-primary));
}

.env-panel-tick {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
}

.env-panel-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.env-panel-expanded {
  width: 260px;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow);
  overflow: hidden;
}

.env-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  font-weight: 500;
}
</style>
