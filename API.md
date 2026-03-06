# 📡 API 接口文档

## 基础信息

- **Base URL**: `https://your-domain.com/api`
- **认证方式**: Bearer Token
- **Content-Type**: `application/json`

---

## 认证相关

### 登录
```http
POST /auth/login
Content-Type: application/json

{
  "schoolAccount": "2020123456",
  "schoolPassword": "your-password"
}
```

**响应:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "realName": "张三",
    "roomName": "武鸣桂园13-513",
    "role": "leader"
  }
}
```

---

## 电费监控

### 获取当前电费
```http
GET /electricity/current
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "balance": 96.28,
    "remainingKwh": 176.95,
    "price": 0.5441,
    "dailyUsage": 2.15,
    "predictedDays": 44,
    "predictedEmptyDate": "2024-04-19",
    "collectedAt": "2024-03-06T08:00:01Z"
  }
}
```

### 获取历史数据
```http
GET /electricity/history?days=7
Authorization: Bearer {token}
```

**参数:**
- `days`: 天数 (2/7/30)

**说明:**
- 只返回 `source='cron'` 的定时任务数据
- 24小时模式(2天数据)用于趋势图显示

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "user_id": 1,
      "balance": 96.28,
      "collected_at": "2024-03-06T08:00:01Z",
      "source": "cron"
    }
  ]
}
```

### 手动刷新数据
```http
POST /electricity/refresh
Authorization: Bearer {token}
```

**说明:**
- 实时从学校系统获取最新数据
- 数据标记为 `source='manual'`
- 不影响24小时趋势图

---

## 投票系统

### 创建投票
```http
POST /votes
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "周末聚餐地点",
  "description": "大家想去哪里吃？",
  "options": ["火锅", "烧烤", "日料", "川菜"],
  "voteType": "single",      // single/multiple
  "requireHalf": false,      // 是否要求半数同意
  "endedAt": "2024-03-10T18:00:00Z"
}
```

### 获取投票列表
```http
GET /votes
Authorization: Bearer {token}
```

### 投票
```http
POST /votes/:id/vote
Authorization: Bearer {token}
Content-Type: application/json

{
  "optionIds": [1]  // 单选传一个，多选可传多个
}
```

---

## 事务管理

### 创建事务
```http
POST /affairs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "交电费",
  "description": "记得充100块",
  "priority": "high",        // low/normal/high
  "dueDate": "2024-03-07T12:00:00Z",
  "isRecurring": false
}
```

### 获取事务列表
```http
GET /affairs
Authorization: Bearer {token}
```

### 完成事务
```http
PATCH /affairs/:id/complete
Authorization: Bearer {token}
```

---

## 用户管理

### 更改身份
```http
POST /user/change-role
Authorization: Bearer {token}
Content-Type: application/json

{
  "newRole": "leader"  // leader/member
}
```

### 获取用户信息
```http
GET /user/profile
Authorization: Bearer {token}
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应格式:**
```json
{
  "error": "错误描述信息"
}
```

---

*最后更新: 2024-03-06*
