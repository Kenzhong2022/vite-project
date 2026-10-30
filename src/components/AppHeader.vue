<!--
  AppHeader：顶部导航组件（从 AppLayout 抽离）
  - 吸顶 header：logo + 电脑端分类导航（hover 展开悬浮面板）/ 移动端汉堡按钮
  - 悬浮面板 teleport 到 body，top 在打开那一刻按 header 实际底边现量
  - 移动端抽屉与汉堡按钮同属移动端导航，一并收进本组件
-->
<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { ArrowDown, Menu } from '@element-plus/icons-vue'
import { useDevice } from '@/composables/useDevice'
import { groupNavByCategory, navItems } from '@/config/navigation.js'

// 设备判断：复用 useDevice（断点分档 + localStorage 可强制切换），desktop = ≥1024px
const { isDesktop } = useDevice()

// 电脑端分类导航与移动端抽屉共用的分组数据
const navGroups = groupNavByCategory(navItems)

// 手机端导航抽屉
const navDrawerOpen = ref(false)

// 电脑端分类导航：hover 哪个分类，面板就展示哪个分类的导航项
const activeCat = ref(null)
const activeGroup = computed(() => navGroups.find((g) => g.category === activeCat.value))

// 面板 teleport 到 body 后脱离了 nav 的 DOM，鼠标从分类移入面板会触发 nav 的 mouseleave，
// 所以关闭走"延迟 + 取消"机制：nav/panel 的 mouseleave 安排关闭，panel 的 mouseenter 取消
let closeTimer = null
function scheduleClose() {
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => (activeCat.value = null), 150)
}
function cancelClose() {
  clearTimeout(closeTimer)
}

// 面板 top 由 header 实际底边计算（header 是 sticky，bottom 即面板应贴的位置）
// getBoundingClientRect 返回的是 border box：padding/border 已自动包含，margin 本就不属于元素盒子
// 在打开面板那一刻现量，滚动导致 sticky 位置变化也不会用到过期值
const headerRef = ref(null)
const panelTop = ref(53) // header 52px + border-bottom 1px，仅作首次测量前的兜底
function updatePanelTop() {
  if (headerRef.value) panelTop.value = headerRef.value.getBoundingClientRect().bottom
}

// 分类 mouseenter：取消待执行的关闭 + 现量 header 底边 + 切换面板内容（内联多语句经 Prettier 换行会解析失败，收进函数）
function onCatEnter(category) {
  cancelClose()
  updatePanelTop()
  activeCat.value = category
}

onUnmounted(() => {
  clearTimeout(closeTimer)
})
</script>

<template>
  <header ref="headerRef" class="app-header">
    <div class="app-header-inner">
      <div class="app-logo">
        <div class="app-logo-icon"><img src="/favicon.svg" /></div>
      </div>
      <!-- 电脑端：分类导航，hover 分类展开面板；手机/平板：汉堡按钮 + 抽屉导航 -->
      <nav v-if="isDesktop" class="app-nav">
        <button
          v-for="group in navGroups"
          :key="group.category"
          class="nav-cat"
          :class="{ 'is-open': activeCat === group.category }"
          type="button"
          @mouseenter="onCatEnter(group.category)"
          @click="activeCat = activeCat === group.category ? null : group.category"
        >
          <span>{{ group.category }}</span>
          <el-icon :size="12"><ArrowDown /></el-icon>
        </button>
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

  <!-- 导航面板 teleport 到 body：不受 header 层叠上下文限制；top 在打开时按 header 实际底边现量 -->
  <Teleport to="body">
    <Transition name="nav-panel">
      <div v-if="activeGroup" class="nav-panel" :style="{ top: `${panelTop}px` }">
        <!-- 单一面板：内容随当前 hover 的分类切换 -->
        <div class="nav-panel-inner">
          <div class="nav-panel-items" @mouseenter="cancelClose" @mouseleave="scheduleClose">
            <router-link
              v-for="item in activeGroup.items"
              :key="item.to"
              :to="item.to"
              :exact-path="item.exact || undefined"
              class="nav-panel-item"
              @click="activeCat = null"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span class="nav-panel-texts">
                <b>{{ item.label }}</b>
                <small>{{ item.desc }}</small>
              </span>
            </router-link>
          </div>
          <div class="nav-panel-backdrop"></div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 手机端导航抽屉：分组展示，router-link 复用 exact 语义做高亮，点击后关闭抽屉 -->
  <el-drawer
    v-model="navDrawerOpen"
    title="导航菜单"
    direction="ltr"
    size="272px"
    class="nav-drawer"
  >
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
</template>

<style>
/* 本组件含 teleport 到 body 的悬浮面板与抽屉，样式块保持非 scoped（全局），直接写普通选择器；
   注意 :global() 只在 <style scoped> 内有意义，这里写它会被当非法伪类导致规则失效。 */

.app-header {
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header-inner {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 52px;
}

.app-logo {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: baseline;
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
  position: relative;
  display: flex;
  gap: 2px;
  height: 100%;
}

.nav-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.nav-cat:hover,
.nav-cat.is-open {
  color: var(--el-color-primary);
}

.nav-cat.is-open .el-icon {
  transform: rotate(180deg);
}

.nav-panel {
  position: fixed;
  top: 0; /* 实际 top 由内联样式按 header 底边动态设置，这里仅兜底 */
  bottom: 0; /* 与 top 一起定界，高度自适应，面板内改 padding/border 不影响 */
  left: 0;
  right: 0;
  z-index: 200;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
}

/* 宽度收口内层容器：与 .app-header-inner 同一惯例，居中 + 限宽；flex: 1 撑满面板高度 */
.nav-panel-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-panel-items {
  width: 100%;
  background-color: #fff;
  padding: 32px 0 10px 0;
}

/* 玻璃填充层：撑满导航项以下剩余空间，半透明背景 + backdrop-filter 才透得出模糊 */
.nav-panel-backdrop {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.nav-panel-enter-active,
.nav-panel-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.nav-panel-enter-from,
.nav-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.nav-panel-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 12px;
  text-decoration: none;
  color: var(--el-text-color-regular);
  transition: all 0.15s;
}

.nav-panel-item > .el-icon {
  margin-top: 2px;
  color: var(--el-color-primary);
}

.nav-panel-texts {
  min-width: 0;
}

.nav-panel-texts b {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.nav-panel-item:hover .nav-panel-texts b {
  color: var(--el-color-primary);
}

.nav-panel-texts small {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
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
</style>
