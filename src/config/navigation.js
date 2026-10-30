// 全站导航 + 首页卡片的单一数据源
// 字段说明：
// - to / icon / label / category：导航项必需（category 用于首页卡片分组）
// - exact：为 true 时仅在路径完全匹配时高亮（首页 / 需要它避免前缀误匹配）
// - desc：首页卡片描述，配置了 desc 的导航项会同时出现在首页卡片网格
// - zone：域归属（'notes' 知识点 | 'media' 媒体工具），SideDock 据此高亮对应的域入口
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
  Aim,
  Picture,
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
    zone: 'notes',
  },
  {
    to: '/static-assets',
    icon: Files,
    label: '静态资源',
    desc: 'public vs src/assets 的处理差异',
    category: 'Vite',
    zone: 'notes',
  },
  {
    to: '/pre-bundle',
    icon: Lightning,
    label: '预构建',
    desc: 'Native ESM vs Bundle 模式 + 预构建原理',
    category: 'Vite',
    zone: 'notes',
  },
  {
    to: '/version-check',
    icon: RefreshRight,
    label: '版本热更新',
    desc: 'build 脚本改写 + 前端轮询 version.json',
    category: 'Vite',
    zone: 'notes',
  },
  {
    to: '/plugin-order',
    icon: Sort,
    label: '插件开发',
    desc: '自定义 Vite 插件 + 钩子执行顺序验证',
    category: 'Vite',
    zone: 'notes',
  },
  {
    to: '/keep-alive-test',
    icon: Timer,
    label: 'KeepAlive',
    desc: '组件缓存：include 名单与生命周期表现',
    category: 'Vue3',
    zone: 'notes',
  },
  {
    to: '/element-theme',
    icon: Brush,
    label: '主题色',
    desc: 'CSS 变量换肤：色阶按官方规则自动生成',
    category: 'Element Plus',
    zone: 'notes',
  },
  {
    to: '/composables',
    icon: Connection,
    label: '组合式函数',
    desc: '有状态逻辑复用：ref vs reactive 返回值对比',
    category: 'Vue3',
    zone: 'notes',
  },
  {
    to: '/component-overhead',
    icon: Histogram,
    label: '组件开销',
    desc: '多余组件抽象的性能损耗：300 个 Badge 实例 vs 0 个',
    category: 'Vue3',
    zone: 'notes',
  },
  {
    to: '/props-stability',
    icon: Aim,
    label: 'Props 稳定性',
    desc: '源头透传 vs 结果透传：onUpdated 实测更新传染 100 → 2',
    category: 'Vue3',
    zone: 'notes',
  },
  {
    to: '/image-cutout',
    icon: Picture,
    label: '图片抠图',
    desc: '浏览器本地推理去背景：上传 → 预览 → 下载透明底 PNG',
    category: '媒体',
    zone: 'media',
  },
  {
    to: '/about',
    icon: InfoFilled,
    label: '关于',
    desc: '项目信息、环境变量、部署说明',
    category: '项目基础',
    zone: 'notes',
  },
]

// 按分类归组：把传入的导航项按 category 首次出现的顺序归组成 [{ category, items }]
// 供首页卡片分区、移动端菜单分组等场景使用；空分类不会出现在结果里
export function groupNavByCategory(items) {
  const categories = [...new Set(items.map((item) => item.category))]
  return categories.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  }))
}
