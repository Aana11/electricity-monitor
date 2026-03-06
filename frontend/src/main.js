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
import { ElNotification, ElButton } from 'element-plus'
import { h } from 'vue'

let updateSWFunction = null

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // 有新版本可用，显示更新提示
    console.log('PWA: 有新版本可用，请刷新页面更新')
    showUpdateNotification()
  },
  onOfflineReady() {
    console.log('PWA: 应用已准备好离线使用')
    ElNotification({
      title: '离线就绪',
      message: '应用已缓存，可离线使用',
      type: 'success',
      duration: 3000,
      position: 'bottom-right'
    })
  },
  onRegistered(r) {
    if (r) {
      console.log('PWA: Service Worker 注册成功')
      updateSWFunction = r
      // 每5分钟检查一次更新
      setInterval(() => {
        r.update()
      }, 5 * 60 * 1000)
    }
  },
  onRegisterError(error) {
    console.error('PWA: Service Worker 注册失败', error)
  }
})

// 显示更新提示通知
function showUpdateNotification() {
  const notification = ElNotification({
    title: '🎉 发现新版本',
    message: h('div', { class: 'pwa-update-message' }, [
      h('p', { style: 'margin: 0 0 12px 0; color: #606266;' }, '网站已更新，点击按钮立即体验新功能'),
      h('div', { style: 'display: flex; gap: 10px;' }, [
        h(ElButton, {
          type: 'primary',
          size: 'small',
          onClick: () => {
            notification.close()
            // 立即更新并刷新
            updateSWFunction?.(true)
          }
        }, { default: () => '立即更新' }),
        h(ElButton, {
          size: 'small',
          onClick: () => {
            notification.close()
          }
        }, { default: () => '稍后' })
      ])
    ]),
    type: 'warning',
    duration: 0, // 不自动关闭
    position: 'top-right',
    showClose: true,
    customClass: 'pwa-update-notification'
  })
}

// 请求通知权限
if ('Notification' in window && 'serviceWorker' in navigator) {
  Notification.requestPermission().then((permission) => {
    console.log('通知权限:', permission)
  })
}
