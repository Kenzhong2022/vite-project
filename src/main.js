import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Element Plus 不再全量导入：组件与样式由 vite.config.mjs 里的
// unplugin-vue-components + ElementPlusResolver 按需注入
createApp(App).use(router).mount('#app')
