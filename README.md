# ⚡ NNNU电费监控系统

南宁师范大学宿舍电费实时监控与可视化平台

## ✨ 功能特性

- 🔐 **学校账号登录** - 直接使用学校电费网站账号登录
- 📊 **实时数据** - 余额、剩余电量、电价一目了然
- 📈 **可视化图表** - 用电趋势、每日用量分析
- 🏆 **排行榜** - 余额告急榜、用电排行榜
- ⏰ **定时采集** - 每2小时自动采集数据
- 🔮 **智能预测** - 预测电费耗尽时间
- 💡 **节电建议** - 基于用电数据的智能建议

## 🏗️ 技术架构

- **前端**: Vue 3 + Element Plus + ECharts
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **部署**: Nginx + PM2 / Docker

## 📁 项目结构

```
electricity-system/
├── backend/              # Node.js后端
│   ├── app.js           # 入口文件
│   ├── config/          # 配置文件
│   ├── routes/          # API路由
│   ├── services/        # 业务逻辑
│   └── middleware/      # 中间件
├── frontend/            # Vue前端
│   ├── src/
│   │   ├── views/       # 页面组件
│   │   ├── components/  # 组件
│   │   ├── stores/      # Pinia状态管理
│   │   └── api/         # API接口
│   └── dist/            # 构建输出
├── database/            # 数据库
│   └── schema.sql       # 表结构
├── docker/              # Docker配置
├── scripts/             # 部署脚本
└── README.md
```

## 🚀 快速部署

### 方式一：一键脚本部署（推荐）

```bash
cd /root/.openclaw/workspace/electricity-system
sudo bash scripts/deploy.sh
```

### 方式二：Docker部署

```bash
cd /root/.openclaw/workspace/electricity-system/docker
docker-compose up -d
```

### 方式三：手动部署

1. **安装依赖**
```bash
# 安装MySQL、Node.js、Nginx
sudo apt update
sudo apt install -y mysql-server nodejs nginx
```

2. **配置数据库**
```bash
sudo mysql < database/schema.sql
```

3. **安装后端依赖**
```bash
cd backend
npm install
cp .env.example .env
# 编辑.env配置数据库连接
npm start
```

4. **构建前端**
```bash
cd frontend
npm install
npm run build
sudo cp -r dist /var/www/electricity-monitor
```

5. **配置Nginx**
```bash
sudo cp scripts/nginx.conf /etc/nginx/sites-available/
sudo systemctl restart nginx
```

## 📡 API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/auth/login | POST | 用户登录 |
| /api/electricity/current | GET | 获取当前电费数据 |
| /api/electricity/history | GET | 获取历史数据 |
| /api/electricity/daily-usage | GET | 获取每日用电统计 |
| /api/electricity/refresh | POST | 手动刷新数据 |
| /api/rankings/balance | GET | 余额排行榜 |
| /api/rankings/usage | GET | 用电排行榜 |

## ⏰ 定时任务

- **每2小时**: 自动采集所有用户电费数据
- **每天00:05**: 计算前一天的用电统计
- **每天00:10**: 生成排行榜数据

## 🔒 安全说明

- 用户密码使用学校系统验证，本地加密存储
- JWT令牌认证，7天有效期
- API限流保护
- SQL注入防护

## 📝 许可证

MIT License

---

Made with ⚡ by 君君 for 君梦大王
