<!-- App 只负责作为应用挂载根，布局全部在 AppLayout（导航、keep-alive、侧边目录、版本轮询） -->
<script setup>
import AppLayout from '@/layouts/AppLayout.vue'
</script>

<template>
  <AppLayout />
</template>
