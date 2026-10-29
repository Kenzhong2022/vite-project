<script setup>
import { useSlots } from 'vue'

// 统一内容卡片：header 默认渲染章节数据的 title（与侧边目录同一数据源），
// 正文由页面通过 default slot 自由编写；需要自定义 header（如带链接）时覆写 #header。
// section.key 同时作为锚点 id 渲染在卡片根元素上（目录点击定位、滚动高亮共用）。
// 额外 class 会经 attribute fallthrough 落到 el-card 上（如 class="live"）。
// 若章节数据带 children（真子章节）：h3 锚点标题自动渲染（顺序 = children 数组顺序），
// 内容用与 key 同名的具名插槽提供（如 #overview-basic），无插槽的子章节只渲染标题。
const props = defineProps({
  section: { type: Object, required: true },
})

// 开发期一致性校验：key 只在数据里写一次，插槽名必须与它对齐。
// 数据改名忘改插槽 / 插槽写错 key，都会在控制台直接报错（而不是静默丢失内容块）。
if (import.meta.env.DEV) {
  const slots = useSlots()
  if (!props.section) {
    console.warn(
      '[SectionCard] section prop 是 undefined —— 页面传入的 s.xxx 在章节数据中不存在（key 改名后未同步）',
    )
  }
  const subKeys = ((props.section ?? {}).children ?? []).map((sub) => sub.key)

  for (const key of subKeys) {
    if (!slots[key]) {
      console.warn(
        `[SectionCard] "${props.section.key}" 的子章节 "${key}" 没有对应的 #${key} 插槽，内容块不会渲染`,
      )
    }
  }
  const known = ['default', 'header', ...subKeys]
  for (const name of Object.keys(slots)) {
    if (!known.includes(name)) {
      console.warn(`[SectionCard] 插槽 #${name} 不存在于章节 "${props.section.key}" 中`)
    }
  }
}
</script>

<template>
  <el-card :id="section.key" class="page-card" shadow="never">
    <template #header
      ><slot name="header">{{ section.title }}</slot></template
    >
    <slot />
    <template v-for="sub in section.children" :key="sub.key">
      <h3 :id="sub.key" class="sub-title">{{ sub.title }}</h3>
      <slot :name="sub.key" />
    </template>
  </el-card>
</template>
