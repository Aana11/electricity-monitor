// 宿舍三两事 - Service Worker
const CACHE_NAME = 'dormitory-app-v1'
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // 图标
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 截图（可选，占用空间大）
  // '/screenshots/dashboard-desktop.jpg',
  // '/screenshots/home-desktop.jpg',
  // '/screenshots/dashboard-mobile.jpg'
]

// ===== 安装：缓存核心资源 =====
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 缓存核心资源')
        return cache.addAll(CACHE_ASSETS)
      })
      .then(() => {
        console.log('[SW] 安装完成')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.error('[SW] 缓存失败:', err)
      })
  )
})

// ===== 激活：清理旧缓存 =====
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] 激活完成')
      return self.clients.claim()
    })
  )
})

// ===== 拦截请求：缓存优先策略 =====
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }
  
  // 跳过 API 请求
  if (url.pathname.startsWith('/api/')) {
    return
  }
  
  // 缓存优先策略
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 1. 如果有缓存，直接返回缓存
      if (cachedResponse) {
        console.log('[SW] 缓存命中:', url.pathname)
        
        // 后台更新缓存（可选）
        fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone())
            })
          }
        }).catch(() => {})
        
        return cachedResponse
      }
      
      // 2. 没有缓存，走网络请求
      console.log('[SW] 网络请求:', url.pathname)
      return fetch(request).then((networkResponse) => {
        // 缓存成功的响应
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return networkResponse
      }).catch((error) => {
        console.error('[SW] 网络失败:', url.pathname, error)
        // 3. 网络和缓存都没有，返回离线页面
        if (request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        throw error
      })
    })
  )
})

// ===== 消息处理（用于跳过等待）=====
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
