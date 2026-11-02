import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 站酷系列字体本地引入（npm 包自托管，无 CDN 依赖）：快乐体已应用，青克黄油体备用
import '@fontsource/zcool-kuaile'
import '@fontsource/zcool-qingke-huangyou'
// Element Plus 不再全量导入：组件与样式由 vite.config.mjs 里的
// unplugin-vue-components + ElementPlusResolver 按需注入
// 暗黑模式变量（useDark 切换 html.dark 后生效），按需注入不会包含它，需手动引入
import 'element-plus/theme-chalk/dark/css-vars.css'

createApp(App).use(router).mount('#app')
