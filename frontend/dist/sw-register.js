// ===== Service Worker 注册代码 =====
// 将此代码放在 </body> 标签结束前，或放在 main.js 中

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] 注册成功:', registration.scope)

        // 检测更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('[SW] 发现新版本')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用
              console.log('[SW] 新版本已安装，刷新页面更新')
              
              // 可选：提示用户刷新
              if (confirm('应用有新版本，是否立即更新？')) {
                newWorker.postMessage('skipWaiting')
                window.location.reload()
              }
            }
          })
        })
      })
      .catch((error) => {
        console.error('[SW] 注册失败:', error)
      })

    // 监听 Service Worker 消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW] 收到消息:', event.data)
    })

    // 监听控制器变化（更新完成）
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] 控制器已更新')
      window.location.reload()
    })
  })
} else {
  console.log('[SW] 浏览器不支持 Service Worker')
}
