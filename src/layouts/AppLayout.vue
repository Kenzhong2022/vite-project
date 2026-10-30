<!--
  AppLayout：应用外壳（唯一布局组件）
  - 顶部导航（数据源 navItems）+ 主内容区（keep-alive 由路由 meta.keepAlive 决定）+ 侧边目录（路由 meta.toc）+ 环境面板
  - 版本轮询也在布局层：只要应用在运行就检查新版本，与当前路由无关
-->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu } from '@element-plus/icons-vue'
import EnvPanel from '@/components/EnvPanel.vue'
import { useDevice } from '@/composables/useDevice'
import { navGroups, navItems } from '@/config/navigation.js'

const POLL_INTERVAL = 5
const remaining = ref(POLL_INTERVAL)

// 设备判断：复用 useDevice（断点分档 + localStorage 可强制切换），desktop = ≥1024px
const { isDesktop } = useDevice()

const isProd = import.meta.env.PROD

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

// 手机端导航抽屉
const navDrawerOpen = ref(false)

let pollTimer = null
let countdownTimer = null
let currentVersion = null

async function checkVersion() {
  if (!isProd) return

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`)
    const data = await res.json()
    const newVersion = data.version

    if (!currentVersion) {
      currentVersion = newVersion
    } else if (currentVersion !== newVersion) {
      if (confirm('发现新版本，页面内容已更新。是否立即刷新加载最新功能？')) {
        window.location.reload()
      }
    }
  } catch (e) {
    console.warn('版本检查失败:', e)
  }
}

onMounted(() => {
  if (!isProd) return

  checkVersion()

  countdownTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      remaining.value = POLL_INTERVAL
    }
  }, 1000)

  pollTimer = setInterval(checkVersion, POLL_INTERVAL * 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <header class="app-header">
    <div class="app-header-inner">
      <div class="app-logo">
        <div class="app-logo-icon"><img src="/favicon.svg" /></div>
        <div style="color: var(--el-color-primary)">Vite</div>
      </div>
      <!-- 电脑端：横排导航；手机/平板：汉堡按钮 + 抽屉导航 -->
      <nav v-if="isDesktop" class="app-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :exact-path="item.exact || undefined"
          active-class="nav-link-active"
          class="nav-link"
        >
          <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span>
        </router-link>
      </nav>
      <button
        v-else
        class="nav-burger"
        type="button"
        aria-label="打开导航菜单"
        @click="navDrawerOpen = true"
      >
        <el-icon :size="20"><Menu /></el-icon>
      </button>
    </div>
  </header>

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

  <!-- 手机端导航抽屉：分组展示，router-link 复用 exact 语义做高亮，点击后关闭抽屉 -->
  <el-drawer v-model="navDrawerOpen" title="导航菜单" direction="ltr" size="272px" class="nav-drawer">
    <nav class="drawer-nav">
      <template v-for="group in navGroups" :key="group.category">
        <div class="nav-group-title">{{ group.category }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :exact-path="item.exact || undefined"
          active-class="nav-item-active"
          class="drawer-nav-item"
          @click="navDrawerOpen = false"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </template>
    </nav>
  </el-drawer>

  <EnvPanel :remaining="remaining" />
</template>

<style>
.app-header {
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 52px;
}

.app-logo {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.app-logo-icon {
  height: 100%;
  display: flex;
  align-items: center;
}

.app-logo-icon img {
  height: 80%;
}

.app-nav {
  display: flex;
  gap: 2px;
}

.app-nav-mobile {
  height: 100%;
  display: flex;
  align-items: center;
}

.nav-burger {
  border: none;
  background: transparent;
  color: var(--el-text-color-primary);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.nav-burger:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 抽屉内容 teleport 到 body；本 style 块非 scoped（全局样式），直接写普通选择器即可。
   注意 :global() 只在 <style scoped> 内有意义，这里写它会被当非法伪类导致规则失效。 */
.nav-group-title {
  padding: 14px 16px 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.5px;
  border-top: 1px solid var(--el-border-color-lighter);
  user-select: none;
}

.drawer-nav > .nav-group-title:first-child {
  border-top: none;
  padding-top: 4px;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  border-radius: 8px;
  margin: 0 8px;
  transition:
    color 0.15s,
    background 0.15s;
}

.drawer-nav-item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.nav-item-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 600;
}

.nav-link {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  border-radius: 6px;
  transition:
    color 0.15s,
    background 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.nav-link-active {
  color: var(--el-color-primary) !important;
  background: var(--el-color-primary-light-9);
}

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
