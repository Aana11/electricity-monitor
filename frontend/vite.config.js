import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        runtimeCaching: [
          {
            urlPattern: new RegExp('^https://fonts.googleapis.com/.*'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: new RegExp('^https://.+.jsdelivr.net/.*'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: '宿舍三两事',
        short_name: '宿舍三两事',
        description: '南宁师范大学宿舍事务一站式平台 - 电费监控、投票抽签、事务管理',
        theme_color: '#667eea',
        background_color: '#667eea',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: '/?source=pwa',
        lang: 'zh-CN',
        dir: 'ltr',
        lang: 'zh-CN',
        categories: ['utilities', 'productivity'],
        prefer_related_applications: false,
        related_applications: [],
        share_target: {
          action: '/share-handler',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'attachments',
                accept: ['image/*', 'text/*', 'application/pdf']
              }
            ]
          }
        },
        icons: [
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        screenshots: [
          { src: '/screenshots/dashboard-desktop.jpg', sizes: '1280x720', type: 'image/jpeg', form_factor: 'wide', label: '电费监控仪表板' },
          { src: '/screenshots/home-desktop.jpg', sizes: '1280x720', type: 'image/jpeg', form_factor: 'wide', label: '首页功能导航' },
          { src: '/screenshots/dashboard-mobile.jpg', sizes: '719x1280', type: 'image/jpeg', form_factor: 'narrow', label: '手机端电费监控' }
        ],
        shortcuts: [
          {
            name: '电费监控',
            short_name: '电费',
            description: '查看实时电费余额',
            url: '/electricity',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }]
          },
          {
            name: '投票抽签',
            short_name: '投票',
            description: '参与宿舍投票和抽签',
            url: '/votes',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }]
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方库分离
          'vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          // ECharts单独打包
          'echarts': ['echarts', 'vue-echarts']
        },
        // 动态导入的chunk命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(js|ts)$/i.test(assetInfo.name)) {
            return 'assets/js/[name]-[hash][extname]'
          }
          if (/\.(css|less|scss)$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
