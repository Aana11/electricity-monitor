// 宿舍三两事 - Service Worker
// 标准版本，便于 PWABuilder 检测

const CACHE_NAME = 'dormitory-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ===== Install 事件 - 缓存核心资源 =====
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[Service Worker] Install failed:', err);
      })
  );
});

// ===== Activate 事件 - 清理旧缓存 =====
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation completed');
      return self.clients.claim();
    })
  );
});

// ===== Fetch 事件 - 缓存优先策略 =====
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // 跳过 API 请求
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中 - 返回缓存
        if (response) {
          console.log('[Service Worker] Cache hit:', url.pathname);
          return response;
        }
        
        // 缓存未命中 - 请求网络
        console.log('[Service Worker] Network fetch:', url.pathname);
        return fetch(event.request)
          .then((networkResponse) => {
            // 缓存成功的响应
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', url.pathname, error);
            
            // 导航请求失败时返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// ===== Message 事件 - 处理消息 =====
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Script loaded');
