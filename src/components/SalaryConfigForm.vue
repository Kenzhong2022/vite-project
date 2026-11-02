<!--
  SalaryConfigForm：工资配置表单（月薪 / 上下班时间 / 加班时长 / 加班收入）
  - settings 是父组件的共享 reactive 对象，表单直接改字段即可（同一引用，父级 watch 自动持久化）
  - 纯内容组件：桌面端嵌在左列面板，移动端放进 el-drawer，容器与布局由父组件决定
-->
<script setup>
defineProps({
  settings: { type: Object, required: true },
})
</script>

<template>
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
</template>
