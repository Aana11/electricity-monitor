// Service Worker for NNNU电费监控
const CACHE_NAME = 'electricity-monitor-v2'

// 安装时清理旧缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Cache opened')
    })
  )
  self.skipWaiting()
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// 判断请求是否应该缓存
function shouldCache(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 不缓存HTML文件
  if (pathname.endsWith('.html') || pathname === '/' || pathname === '/index.html') {
    return false
  }
  
  // 不缓存API请求
  if (pathname.startsWith('/api/')) {
    return false
  }
  
  // 不缓存manifest.json和sw.js
  if (pathname.endsWith('manifest.json') || pathname.endsWith('sw.js')) {
    return false
  }
  
  // 缓存带哈希的JS/CSS文件
  if (/\.[0-9a-z]{8,}\.(js|css)$/.test(pathname)) {
    return true
  }
  
  // 缓存图片和字体
  if (/\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/.test(pathname)) {
    return true
  }
  
  return false
}

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // 网络优先策略（用于HTML和API）
  if (!shouldCache(request)) {
    event.respondWith(
      fetch(request).catch(() => {
        // 网络失败时尝试从缓存读取（仅用于离线体验）
        return caches.match(request).then((response) => {
          if (response) {
            return response
          }
          // 如果缓存也没有，返回离线页面或错误
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return new Response('Network error', { status: 408 })
        })
      })
    )
    return
  }
  
  // 缓存优先策略（用于静态资源）
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 如果有缓存，先返回缓存，同时更新缓存
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => cachedResponse)
      
      return cachedResponse || fetchPromise
    })
  )
})

// 处理推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || '电费预警提醒',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'electricity-alert',
    requireInteraction: true,
    data: {
      url: '/'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('NNNU电费监控', options)
  )
})

// 点击通知
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})
