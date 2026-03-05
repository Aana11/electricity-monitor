# 🏠 宿舍三两事

南宁师范大学宿舍电费监控与投票分工平台 - PWA 版本

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.3-4FC08D.svg?logo=vue.js)
![Vite](https://img.shields.io/badge/vite-5.0-646CFF.svg?logo=vite)

## ✨ 功能介绍

### ⚡ 电费监控
- 实时查看宿舍电费余额
- 电费不足自动提醒
- 历史用电记录查询与统计
- 用电量趋势图表

### 📝 宿舍事务
- 创建事务提醒
- 优先级设置（日常/紧急）
- 截止时间提醒
- 周期事务自动生成

### 🗳️ 投票与分工
- 发起投票决策
- 支持单选/多选
- 要求半数同意选项
- 分工协作选择
- 参与成员限定
- 投票结果实时展示

## 🚀 PWA 特性

本应用已配置为 PWA（渐进式 Web 应用），支持：

- 📱 **可安装** - 添加到手机/电脑主屏幕
- 💾 **离线访问** - Service Worker 缓存核心资源
- 🔔 **推送通知** - 电费预警提醒
- 📤 **分享接收** - 支持其他应用分享内容到本应用
- 🔄 **自动更新** - 检测新版本并提示更新

### PWA 配置

| 配置项 | 值 |
|--------|-----|
| 应用名称 | 宿舍三两事 |
| 主题色 | `#667eea` |
| 显示模式 | standalone |
| 语言 | zh-CN |
| 图标 | 96x96, 128x128, 192x192, 512x512 PNG |
| 截图 | 宽屏(1280x720) x2, 手机(719x1280) x1 |

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite 5
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: ECharts + Vue-ECharts
- **PWA**: vite-plugin-pwa + Workbox

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite3
- **定时任务**: node-cron
- **日志**: winston
- **进程管理**: PM2

### 部署
- **Web 服务器**: Nginx
- **SSL**: Let's Encrypt

## 📁 项目结构

```
electricity-system/
├── frontend/              # 前端项目
│   ├── public/           # 静态资源
│   │   ├── icons/        # PWA 图标
│   │   ├── screenshots/  # PWA 截图
│   │   ├── manifest.json # PWA 清单
│   │   └── sw.js         # Service Worker
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── router/       # 路由配置
│   │   ├── api/          # API 接口
│   │   └── stores/       # Pinia 状态
│   ├── index.html
│   └── vite.config.js    # Vite + PWA 配置
├── backend/               # 后端项目
│   ├── routes/           # 路由
│   ├── services/         # 业务逻辑
│   ├── middleware/       # 中间件
│   ├── data/             # SQLite 数据库
│   └── logs/             # 日志文件
├── database/              # 数据库迁移
├── scripts/               # 部署脚本
└── docker/                # Docker 配置
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+
- PM2 (生产环境)
- Nginx (生产环境)

### 1. 克隆项目

```bash
git clone https://github.com/Aana11/electricity-monitor.git
cd electricity-monitor
```

### 2. 后端部署

```bash
cd backend
npm install

# 开发模式
npm run dev

# 生产模式 (PM2)
pm2 start ecosystem.config.js
```

### 3. 前端部署

```bash
cd frontend
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 部署到 Nginx
cp -r dist/* /var/www/electricity-monitor/
```

### 4. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/electricity-monitor;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PWA 清单不缓存
    location ~* (manifest\.json|sw\.js)$ {
        add_header Cache-Control "no-cache";
    }
}
```

## ⚙️ 配置说明

### 电费采集配置

编辑 `backend/app.js`：

```javascript
// 每2小时采集一次
cron.schedule('0 */2 * * *', () => {
  electricityService.fetchAndStoreData()
})

// 定时任务列表：
// - 电费采集: 每2小时 (00:00, 02:00, ... 22:00)
// - 计算昨日用电: 每天 00:05
// - 检查余额预警: 每4小时
// - 生成周期事务: 每天 08:00
```

### PWA 配置

编辑 `frontend/vite.config.js`：

```javascript
VitePWA({
  manifest: {
    name: '宿舍三两事',
    theme_color: '#667eea',
    // ... 其他配置
  },
  workbox: {
    // 缓存策略配置
  }
})
```

## 🔐 环境变量

创建 `backend/.env`：

```env
PORT=3000
JWT_SECRET=your-secret-key
DB_PATH=./data/database.sqlite
```

## 📱 PWA 使用指南

### 安装应用

**iOS Safari:**
1. 访问网站
2. 点击底部分享按钮
3. 选择"添加到主屏幕"

**Android Chrome:**
1. 访问网站
2. 点击菜单 → "添加到主屏幕"
3. 或等待自动弹出安装提示

**桌面 Chrome:**
1. 访问网站
2. 地址栏右侧点击安装图标
3. 或点击菜单 → "安装 宿舍三两事"

### 接收分享内容

支持从其他应用分享：
- 文本 → 创建事务/投票标题
- 图片 → 附加到事务
- 链接 → 快速分享

## 🐛 调试

### 查看 Service Worker

Chrome DevTools → Application → Service Workers

### 清除缓存

```javascript
// 控制台执行
navigator.serviceWorker.getRegistrations().then(regs => {
  for (let reg of regs) reg.unregister()
})
```

## 📝 更新日志

### 2024-03-05
- ✅ 添加 PWA 支持
- ✅ 配置 Service Worker
- ✅ 添加应用图标和截图
- ✅ 支持离线访问
- ✅ 添加分享接收功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

[MIT](LICENSE) © 2024 宿舍三两事

---

> 💡 **提示**: 本应用为南宁师范大学宿舍定制开发，其他地区可能需要修改电费采集接口。
