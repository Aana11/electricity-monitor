import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')

// PWA Service Worker 注册 (vite-plugin-pwa 虚拟模块)
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // 有新版本可用，可以提示用户刷新
    console.log('PWA: 有新版本可用，请刷新页面更新')
  },
  onOfflineReady() {
    console.log('PWA: 应用已准备好离线使用')
  },
  onRegistered(r) {
    if (r) {
      console.log('PWA: Service Worker 注册成功')
      // 每小时检查一次更新
      setInterval(() => {
        r.update()
      }, 60 * 60 * 1000)
    }
  },
  onRegisterError(error) {
    console.error('PWA: Service Worker 注册失败', error)
  }
})

// 请求通知权限
if ('Notification' in window) {
  Notification.requestPermission().then((permission) => {
    console.log('通知权限:', permission)
  })
}
