<template>
  <div class="page">
    <h1 class="page-title">
      <el-icon><Brush /></el-icon>
      Element 主题色
    </h1>

    <SectionCard :section="s.setting">
      <div class="setting-row">
        <span class="setting-label">主题色</span>
        <el-color-picker v-model="primaryColor" show-alpha />
        <code class="color-code">{{ primaryColor }}</code>
      </div>

      <div class="setting-row">
        <span class="setting-label">预设色板</span>
        <div class="swatches">
          <button
            v-for="c in presets"
            :key="c"
            class="swatch"
            :style="{ background: c }"
            :title="c"
            @click="primaryColor = c"
          />
        </div>
      </div>

      <div class="setting-row">
        <span class="setting-label">暗黑模式</span>
        <el-switch v-model="isDark" />
      </div>

      <div class="setting-row">
        <el-button size="small" @click="resetTheme">恢复默认 (#409EFF)</el-button>
      </div>
    </SectionCard>

    <SectionCard :section="s.vars">
      <div class="vars">
        <div v-for="v in cssVars" :key="v.name" class="var-row">
          <span class="var-chip" :style="chipStyle(v.value)" />
          <code class="var-name">{{ v.name }}</code>
          <code class="var-value">{{ v.value }}</code>
        </div>
      </div>
    </SectionCard>

    <SectionCard :section="s.overview">
      <!-- 子章节 h3 锚点标题由 SectionCard 依据 children 数据自动渲染，
           这里只提供与 key 同名的具名插槽内容，key 不再手写配对 -->
      <template #overview-basic>
        <div class="overview-grid">
          <div class="demo-card">
            <div class="demo-body">
              <el-button type="primary" size="small">Button</el-button>
              <el-button size="small" plain>Plain</el-button>
            </div>
            <div class="demo-name"><span>按钮</span><span class="en">Button</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-icon :size="22" color="var(--el-color-primary)"><Brush /></el-icon>
              <el-icon :size="22"><Clock /></el-icon>
              <el-icon :size="22" color="var(--el-color-primary-light-5)"><Star /></el-icon>
            </div>
            <div class="demo-name"><span>图标</span><span class="en">Icon</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-link type="primary">链接</el-link>
              <el-link type="primary" disabled>禁用</el-link>
            </div>
            <div class="demo-name"><span>链接</span><span class="en">Link</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-text type="primary">Text 文本</el-text>
            </div>
            <div class="demo-name"><span>文本</span><span class="en">Text</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <div class="border-demo" />
            </div>
            <div class="demo-name"><span>边框</span><span class="en">Border</span></div>
          </div>
        </div>
      </template>
      <template #overview-input>
        <div class="overview-grid">
          <div class="demo-card">
            <div class="demo-body">
              <el-input v-model="demoText" size="small" placeholder="请输入" style="width: 110px" />
            </div>
            <div class="demo-name"><span>输入框</span><span class="en">Input</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-select v-model="demoSelect" size="small" placeholder="选择" style="width: 110px">
                <el-option label="选项 A" value="a" />
                <el-option label="选项 B" value="b" />
              </el-select>
            </div>
            <div class="demo-name"><span>选择器</span><span class="en">Select</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-input-number
                v-model="demoNum"
                size="small"
                :min="0"
                :max="99"
                style="width: 110px"
              />
            </div>
            <div class="demo-name"><span>数字输入框</span><span class="en">InputNumber</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-date-picker
                v-model="demoDate"
                type="date"
                size="small"
                placeholder="选择日期"
                style="width: 120px"
              />
            </div>
            <div class="demo-name"><span>日期选择器</span><span class="en">DatePicker</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-checkbox v-model="demoCheck" size="small">备选项</el-checkbox>
            </div>
            <div class="demo-name"><span>多选框</span><span class="en">Checkbox</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-radio-group v-model="demoRadio" size="small">
                <el-radio value="1">A</el-radio>
                <el-radio value="2">B</el-radio>
              </el-radio-group>
            </div>
            <div class="demo-name"><span>单选框</span><span class="en">Radio</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-switch v-model="demoSwitch" />
            </div>
            <div class="demo-name"><span>开关</span><span class="en">Switch</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-slider v-model="demoSlider" style="width: 100px" />
            </div>
            <div class="demo-name"><span>滑块</span><span class="en">Slider</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-rate v-model="demoRate" />
            </div>
            <div class="demo-name"><span>评分</span><span class="en">Rate</span></div>
          </div>
        </div>
      </template>
      <template #overview-display>
        <div class="overview-grid">
          <div class="demo-card">
            <div class="demo-body">
              <el-tag type="primary" size="small">主色</el-tag>
              <el-tag size="small" effect="plain">Plain</el-tag>
            </div>
            <div class="demo-name"><span>标签</span><span class="en">Tag</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-avatar
                :size="40"
                :icon="UserFilled"
                style="background: var(--el-color-primary)"
              />
            </div>
            <div class="demo-name"><span>头像</span><span class="en">Avatar</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-badge :value="9" class="badge-demo">
                <el-button size="small" plain>消息</el-button>
              </el-badge>
            </div>
            <div class="demo-name"><span>徽章</span><span class="en">Badge</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-progress type="circle" :percentage="demoSlider" :width="64" />
            </div>
            <div class="demo-name"><span>进度条</span><span class="en">Progress</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-skeleton animated :rows="2" style="width: 110px" />
            </div>
            <div class="demo-name"><span>骨架屏</span><span class="en">Skeleton</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-image
                src="/JapaneseCity.png"
                fit="cover"
                :preview-src-list="['/JapaneseCity.png']"
                preview-teleported
                style="width: 96px; height: 60px; border-radius: 6px"
              />
            </div>
            <div class="demo-name"><span>图片</span><span class="en">Image</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body empty-body">
              <el-empty :image-size="44" description="无数据" />
            </div>
            <div class="demo-name"><span>空状态</span><span class="en">Empty</span></div>
          </div>
        </div>
      </template>
      <template #overview-feedback>
        <div class="overview-grid">
          <div class="demo-card">
            <div class="demo-body">
              <el-alert type="success" title="成功提示" :closable="false" show-icon />
            </div>
            <div class="demo-name"><span>提示</span><span class="en">Alert</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-button size="small" @click="showMessage">点击弹出</el-button>
            </div>
            <div class="demo-name"><span>消息</span><span class="en">Message</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-button size="small" @click="showNotify">点击弹出</el-button>
            </div>
            <div class="demo-name"><span>通知</span><span class="en">Notification</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-button size="small" @click="showMsgBox">点击弹出</el-button>
            </div>
            <div class="demo-name"><span>弹框</span><span class="en">MessageBox</span></div>
          </div>
          <div class="demo-card">
            <div class="demo-body">
              <el-tooltip content="Tooltip 跟随主题色" placement="top">
                <el-button size="small" plain>悬停我</el-button>
              </el-tooltip>
            </div>
            <div class="demo-name"><span>文字提示</span><span class="en">Tooltip</span></div>
          </div>
        </div>
      </template>
    </SectionCard>

    <SectionCard :section="s.impl">
      <p class="desc">
        主题由
        <code>useElementTheme()</code>（<code>src/composables/useElementTheme.js</code>）驱动： 用
        VueUse 的 <code>useCssVar</code> 把 <code>--el-color-primary</code> 绑定为响应式 ref，
        变化时按 Element Plus 官方 SCSS 的 <code>mix</code> 规则同步生成
        <code>light-3/5/7/8/9</code>、<code>dark-2</code> 和 <code>-rgb</code> 等衍生变量写入
        <code>:root</code>； 选择结果通过 <code>localStorage</code> 持久化，刷新后保持。
      </p>
      <p class="desc">
        暗黑模式由 VueUse 的 <code>useDark</code> 切换 <code>&lt;html class="dark"&gt;</code>， 配合
        <code>element-plus/theme-chalk/dark/css-vars.css</code> 生效，与主题色叠加互不干扰。
      </p>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { Brush, Clock, Star, UserFilled } from '@element-plus/icons-vue'
import { useElementTheme } from '@/composables/useElementTheme'
import SectionCard from '@/components/SectionCard.vue'
// 章节数据单一来源：卡片 header、group 分组小标题、侧边目录都由它构建
import { createSectionMap } from '@/utils/sections'

const s = createSectionMap(sections)

// ElMessage / ElNotification 不手动 import：
// 由 AutoImport + ElementPlusResolver 自动注入 API 及对应 style/css，
// 手动 import 会绕过样式注入导致弹窗无样式

const { primaryColor } = useElementTheme('#409EFF')

const isDark = useDark()
useToggle(isDark)

const presets = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#9C27B0',
  '#009688',
  '#E91E63',
  '#3F51B5',
]

function resetTheme() {
  primaryColor.value = '#409EFF'
}

// 展示真实写入 :root 的变量值（在 composable 的 watch 同步完成后再读取）
const VAR_NAMES = [
  '--el-color-primary',
  '--el-color-primary-rgb',
  '--el-color-primary-light-3',
  '--el-color-primary-light-5',
  '--el-color-primary-light-7',
  '--el-color-primary-light-8',
  '--el-color-primary-light-9',
  '--el-color-primary-dark-2',
]

const cssVars = ref([])
watch(
  primaryColor,
  () => {
    const cs = getComputedStyle(document.documentElement)
    cssVars.value = VAR_NAMES.map((name) => ({
      name,
      value: cs.getPropertyValue(name).trim(),
    }))
  },
  { immediate: true, flush: 'post' },
)

function chipStyle(value) {
  // rgb 变量本身不是颜色，跳过色块展示
  if (!value || value.includes(',')) return {}
  return { background: value }
}

// 组件演示数据
const demoText = ref('')
const demoSelect = ref('')
const demoNum = ref(1)
const demoDate = ref('')
const demoCheck = ref(true)
const demoRadio = ref('1')
const demoSwitch = ref(true)
const demoSlider = ref(60)
const demoRate = ref(4)

function showMessage() {
  // 不带 type 的默认 Message 直接使用主题色（背景 light-9 / 文字 primary）
  ElMessage('默认 Message 直接跟随主题色')
}

function showNotify() {
  ElNotification({ title: '主题色', message: '通知组件同样使用 CSS 变量', type: 'success' })
}

function showMsgBox() {
  ElMessageBox.alert('弹框内容同样取自 CSS 变量', '主题色', { confirmButtonText: '知道了' })
}
</script>

<style scoped>
.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-label {
  width: 76px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.color-code {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.swatches {
  display: flex;
  gap: 8px;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}

.swatch:hover {
  transform: scale(1.15);
}

.vars {
  display: grid;
  gap: 8px;
}

.var-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.var-chip {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.var-name {
  min-width: 230px;
  color: var(--el-color-primary);
}

.var-value {
  color: var(--el-text-color-regular);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.demo-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    box-shadow 0.2s,
    transform 0.2s,
    border-color 0.2s;
}

.demo-card:hover {
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-2px);
}

.demo-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 10px;
  min-height: 86px;
}

.demo-name {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: flex;
  justify-content: space-between;
  background: var(--el-fill-color-lighter);
}

.demo-name .en {
  color: var(--el-text-color-secondary);
}

.border-demo {
  width: 56px;
  height: 36px;
  border: 2px solid var(--el-color-primary);
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
}

.empty-body :deep(.el-empty) {
  padding: 0;
}
</style>
<script>
// 章节数据单一来源：卡片 header 与侧边目录（router meta.toc，见 router/index.js）都由它构建；
// script setup 可直接引用这里的顶层声明（编译后同属一个模块）
// 组件总览是无独立正文的章节，其下 4 个分组是真子章节（锚点 = 卡片内的 h3，内容 = 各组组件网格）
export const sections = [
  { key: 'setting', title: '主题设置' },
  { key: 'vars', title: '生成的 CSS 变量（写入 :root）' },
  {
    key: 'overview',
    title: '组件总览（全部实时跟随主题色）',
    children: [
      { key: 'overview-basic', title: '基础组件' },
      { key: 'overview-input', title: '数据录入' },
      { key: 'overview-display', title: '数据展示' },
      { key: 'overview-feedback', title: '反馈' },
    ],
  },
  { key: 'impl', title: '实现说明' },
]
</script>
