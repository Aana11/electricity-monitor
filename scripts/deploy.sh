#!/bin/bash

# NNNU电费监控系统部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 NNNU电费监控系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用root权限运行此脚本${NC}"
    exit 1
fi

# 1. 安装依赖
echo -e "${YELLOW}[1/6] 安装系统依赖...${NC}"
apt-get update
apt-get install -y nginx mysql-server nodejs npm git

# 2. 配置MySQL
echo -e "${YELLOW}[2/6] 配置MySQL...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS electricity_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'electricity_user'@'localhost' IDENTIFIED BY 'Electricity@2024!';"
mysql -e "GRANT ALL PRIVILEGES ON electricity_monitor.* TO 'electricity_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 导入数据库结构
mysql electricity_monitor < /root/.openclaw/workspace/electricity-system/database/schema.sql
echo -e "${GREEN}✓ 数据库配置完成${NC}"

# 3. 安装Node.js依赖
echo -e "${YELLOW}[3/6] 安装后端依赖...${NC}"
cd /root/.openclaw/workspace/electricity-system/backend
npm install

# 创建环境文件
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=electricity_user
DB_PASSWORD=Electricity@2024!
DB_NAME=electricity_monitor

JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES=7d

FRONTEND_URL=http://localhost
NODE_ENV=production

SCHOOL_BASE_URL=https://wpp.nnnu.edu.cn
EOF

echo -e "${GREEN}✓ 后端配置完成${NC}"

# 4. 构建前端
echo -e "${YELLOW}[4/6] 构建前端...${NC}"
cd /root/.openclaw/workspace/electricity-system/frontend
npm install
npm run build

cp -r dist /var/www/electricity-monitor
echo -e "${GREEN}✓ 前端构建完成${NC}"

# 5. 配置Nginx
echo -e "${YELLOW}[5/6] 配置Nginx...${NC}"
cat > /etc/nginx/sites-available/electricity-monitor << 'EOF'
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /var/www/electricity-monitor;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/electricity-monitor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo -e "${GREEN}✓ Nginx配置完成${NC}"

# 6. 配置PM2
echo -e "${YELLOW}[6/6] 配置PM2...${NC}"
npm install -g pm2

cat > /root/.openclaw/workspace/electricity-system/backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'electricity-monitor',
    script: './app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

cd /root/.openclaw/workspace/electricity-system/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✓ PM2配置完成${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址: http://$(curl -s ifconfig.me)"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs electricity-monitor"
echo "  重启服务: pm2 restart electricity-monitor"
echo "  停止服务: pm2 stop electricity-monitor"
echo ""
