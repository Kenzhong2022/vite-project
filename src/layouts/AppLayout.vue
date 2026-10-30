<!--
  AppLayout：应用外壳（唯一布局组件）
  - 顶部导航抽离为 AppHeader；主内容区（keep-alive 由路由 meta.keepAlive 决定）+ 侧边目录（路由 meta.toc）
  - 版本轮询/环境面板属应用级横切逻辑，挂在 App 根组件
-->
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useDevice } from '@/composables/useDevice'

// 设备判断：复用 useDevice（断点分档 + localStorage 可强制切换），desktop = ≥1024px（侧边目录显隐用）
const { isDesktop } = useDevice()

// keep-alive 的 include 名单由路由表决定：
// 凡是路由 meta.keepAlive === true 的路由，其 name（与组件注入的 name 一致）进入缓存名单
const router = useRouter()
const keepAliveIncludes = router
  .getRoutes()
  .filter((r) => r.meta.keepAlive)
  .map((r) => r.name)

const route = useRoute()
// 侧边目录：来自当前路由 meta.toc（页面章节数据的单一来源，见各页 *Sections.js）
// 目录 ↔ 卡片的双向关联交给 el-anchor（点击滚动 + 滚动高亮都是组件内建行为）：
// offset/bound = 72px 对齐吸顶头部（52px）+ 呼吸空间，与 .page-card 的 scroll-margin-top 一致；
// 卡片锚点 id 由 SectionCard 用 section.key 渲染
const tocSections = computed(() => route.meta.toc || [])
</script>

<template>
  <AppHeader />

  <main class="app-main">
    <div class="app-layout">
      <div class="app-content">
        <router-view v-slot="{ Component }">
          <keep-alive :include="keepAliveIncludes">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
      <aside v-if="tocSections.length && isDesktop" class="app-toc">
        <el-anchor :offset="72" :bound="72">
          <el-anchor-link v-for="sec in tocSections" :key="sec.key" :href="`#${sec.key}`">
            <!-- element-plus 2.14 的 anchor-link：标题内容走 default slot（无 #title slot），
                 子链接走 #sub-link slot；title prop 只是 default slot 的 fallback -->
            <span class="anchor-row">
              <el-icon v-if="sec.icon"><component :is="sec.icon" /></el-icon>
              {{ sec.title }}
            </span>
            <!-- 子章节：既有锚点也有内容，独立定位与高亮 -->
            <template #sub-link>
              <el-anchor-link
                v-for="sub in sec.children"
                :key="sub.key"
                :href="`#${sub.key}`"
                :title="sub.title"
              />
            </template>
          </el-anchor-link>
        </el-anchor>
      </aside>
    </div>
  </main>
</template>

<style>
.app-main {
  min-height: calc(100vh - 52px);
  padding: 24px 0;
}

.app-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.app-content {
  flex: 1;
  min-width: 0;
}

.app-toc {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 76px; /* header 52px + 间距 24px */
  max-height: calc(100vh - 100px);
  overflow: auto;
}
</style>
