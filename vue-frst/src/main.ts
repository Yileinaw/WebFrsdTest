import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 引入 ECharts
import "echarts";

import App from './App.vue'
import router from './router'

// Correct the path to the global CSS file
import './assets/main.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus) // 注册 Element Plus

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

// --- Remove debugging line ---
// console.log('Registered Routes:', router.getRoutes());
// --- End debugging line ---
