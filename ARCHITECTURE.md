# 🏗️ 项目架构与技术细节

## 📋 目录

- [系统架构](#系统架构)
- [数据库设计](#数据库设计)
- [核心业务逻辑](#核心业务逻辑)
- [文件功能详解](#文件功能详解)
- [时区处理](#时区处理)
- [PWA 实现细节](#pwa-实现细节)

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         客户端                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   PWA 网页   │  │  Android APP │  │    浏览器访问        │ │
│  │  (Vue3)     │  │  (WebView)   │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          └────────────────┴────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Nginx 服务器                          │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   静态资源 (frontend)    │  │    API 代理 (backend)    │  │
│  │   - HTML/CSS/JS         │  │    - /api/* → Node.js    │  │
│  │   - app.apk 下载        │  │    - WebSocket 支持       │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js 后端服务                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Express   │  │   SQLite3   │  │    node-cron        │ │
│  │   REST API  │  │   Database  │  │    定时任务          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 数据库设计

### 核心表结构

#### 1. users - 用户表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_account TEXT UNIQUE NOT NULL,    -- 学校账号（学号）
  school_password TEXT NOT NULL,          -- 学校系统密码（AES加密）
  real_name TEXT,                         -- 真实姓名
  room_name TEXT,                         -- 宿舍名称（如：武鸣桂园13-513）
  device_no TEXT,                         -- 电表设备号
  role TEXT DEFAULT 'member',             -- 角色：leader/member
  is_active INTEGER DEFAULT 1,            -- 是否激活
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. electricity_records - 电费记录表
```sql
CREATE TABLE electricity_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_no TEXT NOT NULL,
  balance REAL NOT NULL,                  -- 余额（元）
  price REAL NOT NULL,                    -- 电价（元/度）
  remaining_kwh REAL NOT NULL,            -- 剩余电量（度）
  meter_reading_time DATETIME,            -- 电表读数时间
  collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'cron'              -- 数据来源：cron(定时)/manual(手动)
);
```
**关键字段说明：**
- `source`: 区分定时任务采集(`cron`)和手动刷新(`manual`)
- 24小时趋势图只显示 `source='cron'` 的数据
- 每2小时采集一次，24小时共12个数据点

#### 3. daily_usage - 每日用电统计表
```sql
CREATE TABLE daily_usage (
  user_id INTEGER NOT NULL,
  device_no TEXT NOT NULL,
  date DATE NOT NULL,                     -- 日期
  start_balance REAL,                     -- 当日开始余额
  end_balance REAL,                       -- 当日结束余额
  used_kwh REAL,                          -- 用电量（度）
  used_amount REAL,                       -- 用电金额（元）
  record_count INTEGER,                   -- 当日记录数
  PRIMARY KEY (user_id, device_no, date)
);
```

#### 4. votes - 投票表
```sql
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL,
  vote_type TEXT DEFAULT 'single',        -- single/multiple
  require_half INTEGER DEFAULT 0,         -- 是否要求半数同意
  status TEXT DEFAULT 'active',           -- active/ended
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 核心业务逻辑

### 1. 电费数据采集流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  定时任务    │────▶│  学校系统    │────▶│  数据解析    │
│ (node-cron) │     │  (nnnu.edu) │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────────┐
              │  source='cron'  │
              │  存入数据库      │
              └─────────────────┘
```

**代码位置：** `backend/services/electricityService.js`

```javascript
// 定时任务采集（每2小时）
async function collectUserData(user, source = 'cron') {
  // 登录学校系统
  // 获取电表数据
  // 存入数据库，标记 source
}

// 手动刷新（用户点击刷新按钮）
await electricityService.collectUserData(user, 'manual');
```

### 2. 余额趋势图数据处理

**24小时模式：**
```javascript
// 只保留定时任务数据，每2小时一个点
// 北京时间分组：0:00, 2:00, 4:00, ... 22:00
const hourKey = Math.floor(bjTime.getHours() / 2) * 2;
```

**数据过滤：**
- 只查询 `source='cron'` 的数据
- 24小时内最多12个点
- X轴显示 `时:00` 格式
- Tooltip显示完整北京时间

### 3. 时区处理逻辑

**问题：** 数据库存储 UTC 时间，前端需要显示北京时间

**解决方案：**
```javascript
// 后端 → 前端：UTC 字符串
// 前端处理：UTC + 8小时 = 北京时间
const toBeijingTime = (utcDateStr) => {
  const date = new Date(utcDateStr);
  return new Date(date.getTime() + 8 * 60 * 60 * 1000);
};
```

---

## 文件功能详解

### 后端文件 (`backend/`)

| 文件 | 功能 | 关键技术 |
|------|------|----------|
| `app.js` | 应用入口 | Express, 中间件配置, 定时任务初始化 |
| `routes/electricity.js` | 电费API路由 | JWT认证, RESTful API |
| `routes/votes.js` | 投票API路由 | 事务处理, 权限验证 |
| `routes/affairs.js` | 事务API路由 | CRUD操作 |
| `services/electricityService.js` | 电费采集服务 | axios, 学校系统对接, 数据解析 |
| `services/alertService.js` | 预警服务 | 邮件通知, 余额检查 |
| `services/recurringAffairService.js` | 周期事务服务 | 周期计算, 自动生成 |
| `middleware/auth.js` | JWT认证中间件 | jsonwebtoken验证 |
| `config/database.js` | 数据库配置 | SQLite3, 连接池 |

### 前端文件 (`frontend/src/`)

| 文件 | 功能 | 关键技术 |
|------|------|----------|
| `views/Dashboard.vue` | 电费监控页 | ECharts, 24h/7d/30d趋势图 |
| `views/NavHome.vue` | 首页导航 | PWA更新提示, APP下载 |
| `views/Votes.vue` | 投票列表 | 实时数据 |
| `views/Affairs.vue` | 事务管理 | 倒计时组件 |
| `main.js` | 应用入口 | PWA注册, 更新检测 |
| `api/index.js` | API封装 | axios拦截器 |
| `stores/user.js` | 用户状态 | Pinia |
| `router/index.js` | 路由配置 | Vue Router, 路由守卫 |

### 配置文件

| 文件 | 功能 | 配置项 |
|------|------|--------|
| `vite.config.js` | Vite + PWA配置 | manifest, workbox, 代码分割 |
| `public/sw.js` | Service Worker | 缓存策略, 离线支持 |
| `public/manifest.json` | PWA清单 | 应用信息, 图标, 主题色 |
| `ecosystem.config.js` | PM2配置 | 进程管理, 日志配置 |

---

## 时区处理

### 数据流向

```
学校系统(UTC+8) ──▶ 后端采集(UTC) ──▶ 数据库存储(UTC) ──▶ 前端显示(UTC+8)
     北京时间            转为UTC            UTC存储            +8小时转换
```

### 关键代码

**后端存储：**
```javascript
// SQLite 默认存储 UTC 时间
await db.run(
  `INSERT INTO electricity_records (collected_at, ...)
   VALUES (datetime('now'), ...)`,  // UTC 时间
  [...]
);
```

**前端显示：**
```javascript
// formatTime.js
const formatTime = (time) => {
  const date = new Date(time);  // UTC
  const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return `${beijingDate.getMonth() + 1}月${beijingDate.getDate()}日 
          ${String(beijingDate.getHours()).padStart(2, '0')}:
          ${String(beijingDate.getMinutes()).padStart(2, '0')}`;
};
```

---

## PWA 实现细节

### 1. 更新检测机制

```
┌─────────────────┐
│  vite-plugin-pwa │
│  registerType:  │
│   'prompt'      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ 每5分钟检查更新  │────▶│ 发现新版本?     │
│ r.update()      │     │ onNeedRefresh() │
└─────────────────┘     └────────┬────────┘
                                 │
                    是 ──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ ElNotification 提示  │
         │ "发现新版本"          │
         │ [立即更新] [稍后]    │
         └─────────────────────┘
```

**代码：** `frontend/src/main.js`

### 2. 缓存策略

| 资源类型 | 缓存策略 | 说明 |
|----------|----------|------|
| JS/CSS/图片 | Cache First | 优先使用缓存，离线可用 |
| API请求 | Network First | 优先网络，失败用缓存 |
| manifest/sw.js | No Cache | 确保最新版本 |

### 3. Service Worker 生命周期

```
Install ──▶ Waiting ──▶ Activate ──▶ Idle
   │                          │
   ▼                          ▼
缓存静态资源               清理旧缓存
(skipWaiting)             (clients.claim)
```

---

## 部署架构

### 生产环境目录结构

```
/var/www/electricity-monitor/    # Nginx 根目录
├── index.html                   # 入口页面
├── app.apk                      # Android APP下载
├── manifest.webmanifest         # PWA清单
├── sw.js                        # Service Worker
├── workbox-*.js                 # Workbox库
└── assets/                      # 静态资源
    ├── js/                      # JavaScript
    ├── css/                     # 样式
    └── images/                  # 图片

/root/electricity-monitor/       # 后端代码
├── backend/
│   ├── app.js                   # 主程序
│   ├── data/
│   │   └── database.sqlite      # 数据库
│   └── logs/                    # 日志文件
└── ...
```

### 关键配置

**Nginx:**
```nginx
# 静态资源缓存1年
location ~* \.(js|css|png|jpg|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# PWA文件不缓存
location ~* (manifest\.webmanifest|sw\.js)$ {
    add_header Cache-Control "no-cache";
}

# API代理
location /api/ {
    proxy_pass http://localhost:3000;
}
```

---

## 安全考虑

1. **密码加密**: 学校系统密码使用 AES 加密存储
2. **JWT认证**: API请求需携带有效 Token
3. **SQL注入防护**: 使用参数化查询
4. **CORS限制**: 只允许特定域名访问
5. **XSS防护**: 用户输入进行转义处理

---

*文档版本: 2024-03-06*
*作者: 君梦大王 & 君君*
