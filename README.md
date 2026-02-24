# 🏠 宿舍管理系统

南宁师范大学宿舍电费监控与投票分工平台

## 功能介绍

### ⚡ 电费监控
- 实时查看宿舍电费余额
- 电费不足提醒
- 历史用电记录查询

### 📝 宿舍事务
- 创建事务提醒
- 优先级设置（日常/紧急）
- 截止时间提醒

### 🗳️ 投票与分工
- 发起投票决策
- 支持单选/多选
- 要求半数同意选项
- 分工协作选择
- 参与成员限定

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus
- **后端**: Node.js + Express
- **数据库**: SQLite
- **Web服务器**: Nginx

## 项目结构

```
electricity-system/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── views/    # 页面组件
│   │   ├── router/   # 路由配置
│   │   └── api/      # API 接口
│   └── dist/         # 构建产物
├── backend/           # 后端项目
│   ├── routes/       # 路由
│   ├── services/     # 业务逻辑
│   ├── middleware/   # 中间件
│   └── data/         # 数据库
```

## 部署

### 后端部署
```bash
cd backend
npm install
pm2 start ecosystem.config.js
```

### 前端部署
```bash
cd frontend
npm install
npm run build
# 将 dist 目录内容复制到 Nginx 网站根目录
```

## License

MIT
