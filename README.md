# 🏠 宿舍三两事

南宁师范大学宿舍电费监控与投票分工平台 - PWA 版本

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.3-4FC08D.svg?logo=vue.js)
![Vite](https://img.shields.io/badge/vite-5.0-646CFF.svg?logo=vite)
![Node](https://img.shields.io/badge/node-18+-339933.svg?logo=node.js)

## ✨ 功能介绍

### ⚡ 电费监控
- 实时查看宿舍电费余额
- 电费不足自动提醒
- 历史用电记录查询与统计
- **24小时趋势图**：每2小时一个数据点，共12个点
- **7天/30天趋势**：按天聚合显示
- 北京时间显示，时区自动转换

### 📝 宿舍事务
- 创建事务提醒
- 优先级设置（日常/紧急）
- 截止时间倒计时
- 周期事务自动生成

### 🗳️ 投票与分工
- 发起投票决策
- 支持单选/多选
- 要求半数同意选项
- 分工协作选择
- 参与成员限定
- 投票结果实时展示

### 📱 Android APP
- 提供原生 APK 下载
- WebView 封装，体验更流畅
- 与 PWA 共用一套后端 API

## 🚀 PWA 特性

本应用已配置为 PWA（渐进式 Web 应用），支持：

- 📱 **可安装** - 添加到手机/电脑主屏幕
- 💾 **离线访问** - Service Worker 缓存核心资源
- 🔔 **推送通知** - 电费预警提醒
- 🔄 **自动更新** - 检测新版本并提示更新
- 📤 **分享接收** - 支持其他应用分享内容到本应用

### PWA 更新提示

当有新版本时，右上角会弹出提示：
```
🎉 发现新版本
网站已更新，点击按钮立即体验新功能
[立即更新] [稍后]
```

---

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.3 | 前端框架 |
| Vite | 5.0 | 构建工具 |
| Element Plus | 2.x | UI 组件库 |
| Pinia | 2.x | 状态管理 |
| ECharts | 5.x | 数据可视化 |
| vite-plugin-pwa | 0.21 | PWA 支持 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| Express | 4.x | Web 框架 |
| SQLite3 | 5.x | 数据库 |
| node-cron | 3.x | 定时任务 |
| winston | 3.x | 日志记录 |
| PM2 | 5.x | 进程管理 |

---

## 📁 项目结构

```
electricity-system/
├── frontend/              # 前端项目 (Vue3 + Vite)
│   ├── public/           # 静态资源
│   │   ├── icons/        # PWA 图标 (96x96 ~ 512x512)
│   │   ├── screenshots/  # PWA 截图
│   │   ├── manifest.json # PWA 清单
│   │   └── sw.js         # Service Worker
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   │   ├── NavHome.vue      # 首页导航
│   │   │   ├── Dashboard.vue    # 电费监控
│   │   │   ├── Votes.vue        # 投票列表
│   │   │   ├── Affairs.vue      # 事务管理
│   │   │   └── ...
│   │   ├── router/       # 路由配置
│   │   ├── api/          # API 接口封装
│   │   ├── stores/       # Pinia 状态管理
│   │   └── main.js       # 应用入口 (PWA注册)
│   ├── index.html
│   └── vite.config.js    # Vite + PWA 配置
│
├── backend/               # 后端项目 (Express)
│   ├── routes/           # API 路由
│   │   ├── electricity.js   # 电费相关
│   │   ├── votes.js         # 投票相关
│   │   ├── affairs.js       # 事务相关
│   │   └── auth.js          # 认证相关
│   ├── services/         # 业务逻辑
│   │   ├── electricityService.js  # 电费采集
│   │   ├── alertService.js        # 预警服务
│   │   └── recurringAffairService.js  # 周期事务
│   ├── middleware/       # 中间件
│   │   └── auth.js       # JWT认证
│   ├── config/           # 配置文件
│   │   └── database.js   # 数据库连接
│   ├── data/             # SQLite 数据库
│   ├── logs/             # 日志文件
│   └── app.js            # 应用入口
│
├── database/              # 数据库迁移脚本
├── scripts/               # 部署脚本
├── ARCHITECTURE.md        # 架构文档 ⭐
├── API.md                 # 接口文档 ⭐
└── README.md              # 项目说明
```

---

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

**后端端口**: 3000

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
    
    # 前端路由支持 (Vue Router history 模式)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # APK 下载
    location /app.apk {
        add_header Content-Type application/vnd.android.package-archive;
        add_header Content-Disposition "attachment; filename=宿舍三两事.apk";
    }
    
    # 静态资源缓存1年
    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PWA 文件不缓存
    location ~* (manifest\.webmanifest|sw\.js)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

## ⚙️ 核心配置

### 电费采集配置

编辑 `backend/app.js`：

```javascript
// 每2小时采集一次电费数据
cron.schedule('0 */2 * * *', () => {
  electricityService.collectAllUsersData()
})

// 每天 00:05 计算昨日用电统计
cron.schedule('5 0 * * *', () => {
  electricityService.calculateDailyUsage()
})

// 每4小时检查余额预警
cron.schedule('0 */4 * * *', () => {
  alertService.checkBalanceAlerts()
})

// 每天 08:00 生成周期事务
cron.schedule('0 8 * * *', () => {
  recurringAffairService.generateRecurringAffairs()
})
```

### 数据库时区处理

- **存储**: 统一使用 UTC 时间
- **显示**: 前端 +8 小时转换为北京时间
- **趋势图**: 按北京时间 0:00, 2:00, 4:00... 分组

---

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

### 更新机制

1. 应用每 5 分钟检查一次更新
2. 发现新版本时弹出提示
3. 点击"立即更新"刷新页面加载新版本
4. 点击"稍后"保留当前版本

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构、数据库设计、时区处理、PWA实现 |
| [API.md](./API.md) | REST API 接口详细说明 |
| [README.md](./README.md) | 项目简介与快速开始 |

---

## 🐛 调试

### 查看 Service Worker

Chrome DevTools → Application → Service Workers

### 查看 PWA 清单

Chrome DevTools → Application → Manifest

### 清除缓存

```javascript
// 控制台执行
navigator.serviceWorker.getRegistrations().then(regs => {
  for (let reg of regs) reg.unregister()
})
location.reload()
```

---

## 📝 更新日志

### 2024-03-06
- ✅ 添加 24 小时余额趋势图（12个数据点）
- ✅ 区分定时任务和手动刷新数据
- ✅ 修复时区问题，统一显示北京时间
- ✅ 添加 PWA 更新提示功能
- ✅ 添加 Android APP 下载入口
- ✅ 完善架构文档和 API 文档

### 2024-03-05
- ✅ 添加 PWA 支持
- ✅ 配置 Service Worker
- ✅ 添加应用图标和截图

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

[MIT](LICENSE) © 2024 宿舍三两事

---

> 💡 **提示**: 本应用为南宁师范大学宿舍定制开发，其他地区可能需要修改电费采集接口。

> 🔒 **安全提醒**: 学校账号密码使用 AES 加密存储，请勿泄露密钥。
