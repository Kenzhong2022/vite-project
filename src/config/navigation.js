// 全站导航 + 首页卡片的单一数据源
// 字段说明：
// - to / icon / label / category：导航项必需（category 用于首页卡片分组）
// - exact：为 true 时仅在路径完全匹配时高亮（首页 / 需要它避免前缀误匹配）
// - desc：首页卡片描述，配置了 desc 的导航项会同时出现在首页卡片网格
import {
  HomeFilled,
  Files,
  Lightning,
  Timer,
  Sort,
  RefreshRight,
  Brush,
  Connection,
  Histogram,
  InfoFilled,
} from '@element-plus/icons-vue'

export const navItems = [
  {
    to: '/',
    icon: HomeFilled,
    label: '首页',
    exact: true,
    desc: '项目总览：全部实验页面的分组导航',
    category: '项目基础',
  },
  {
    to: '/static-assets',
    icon: Files,
    label: '静态资源',
    desc: 'public vs src/assets 的处理差异',
    category: 'Vite',
  },
  {
    to: '/pre-bundle',
    icon: Lightning,
    label: '预构建',
    desc: 'Native ESM vs Bundle 模式 + 预构建原理',
    category: 'Vite',
  },
  {
    to: '/version-check',
    icon: RefreshRight,
    label: '版本热更新',
    desc: 'build 脚本改写 + 前端轮询 version.json',
    category: 'Vite',
  },
  {
    to: '/plugin-order',
    icon: Sort,
    label: '插件开发',
    desc: '自定义 Vite 插件 + 钩子执行顺序验证',
    category: 'Vite',
  },
  {
    to: '/keep-alive-test',
    icon: Timer,
    label: 'KeepAlive',
    desc: '组件缓存：include 名单与生命周期表现',
    category: 'Vue3',
  },
  {
    to: '/element-theme',
    icon: Brush,
    label: '主题色',
    desc: 'CSS 变量换肤：色阶按官方规则自动生成',
    category: 'Element Plus',
  },
  {
    to: '/composables',
    icon: Connection,
    label: '组合式函数',
    desc: '有状态逻辑复用：ref vs reactive 返回值对比',
    category: 'Vue3',
  },
  {
    to: '/component-overhead',
    icon: Histogram,
    label: '组件开销',
    desc: '多余组件抽象的性能损耗：300 个 Badge 实例 vs 0 个',
    category: 'Vue3',
  },
  {
    to: '/about',
    icon: InfoFilled,
    label: '关于',
    desc: '项目信息、环境变量、部署说明',
    category: '项目基础',
  },
]

// 首页卡片的分组展示顺序
export const categoryOrder = ['Vite', 'Element Plus', 'Vue3', '项目基础']
