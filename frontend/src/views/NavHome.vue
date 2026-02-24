<template>
  <div class="nav-home">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="glass-ball ball-1"></div>
      <div class="glass-ball ball-2"></div>
      <div class="glass-ball ball-3"></div>
    </div>

    <!-- 头部 -->
    <header class="glass-header">
      <div class="header-brand">
        <div class="brand-icon">
          <Lightning class="icon-svg" />
        </div>
        <span class="brand-text">宿舍三两事</span>
      </div>
      
      <div class="header-user">
        <el-dropdown trigger="click">
          <div class="user-avatar glass">
            <UserFilled class="avatar-icon" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <Setting class="menu-icon" /> 设置
              </el-dropdown-item>
              <el-dropdown-item divided>
                <SwitchButton class="menu-icon" /> 退出
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-container">
      <!-- 欢迎语 -->
      <section class="welcome-section glass-card">
        <div class="welcome-content">
          <h1 class="greeting">{{ greeting }}，{{ userName }} 👋</h1>
          <p class="subtitle">欢迎来到您的个人空间</p>
        </div>
        <div class="time-display">
          <div class="time">{{ currentTime }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </section>

      <!-- 功能导航网格 -->
      <section class="nav-grid">
        <h2 class="section-title">
          <span class="title-icon">🚀</span>
          常用功能
        </h2>
        
        <div class="grid-container">
          <!-- 电费查询 -->
          <router-link to="/electricity" class="nav-card glass-card featured">
            <div class="card-glow"></div>
            <div class="card-icon-wrapper">
              <div class="icon-bg electricity">
                <Lightning class="card-icon" />
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-title">电费查询</h3>
              <p class="card-desc">宿舍电费实时监控</p>
            </div>
            <div class="card-arrow">
              <ArrowRight class="arrow-icon" />
            </div>
            <div class="card-badge hot">HOT</div>
          </router-link>

          <!-- 宿舍事务 -->
          <router-link to="/affairs" class="nav-card glass-card">
            <div class="card-icon-wrapper">
              <div class="icon-bg affairs">
                <List class="card-icon" />
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-title">宿舍事务</h3>
              <p class="card-desc">事务提醒与倒计时</p>
            </div>
            <div class="card-arrow">
              <ArrowRight class="arrow-icon" />
            </div>
          </router-link>

          <!-- 投票与分工 -->
          <router-link to="/votes" class="nav-card glass-card">
            <div class="card-icon-wrapper">
              <div class="icon-bg votes">
                <DataLine class="card-icon" />
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-title">投票与分工</h3>
              <p class="card-desc">投票决策 & 分工协作</p>
            </div>
            <div class="card-arrow">
              <ArrowRight class="arrow-icon" />
            </div>
            <div class="card-badge new">NEW</div>
          </router-link>
        </div>
      </section>

      <!-- 快捷工具 -->
      <section class="quick-tools">
        <h2 class="section-title">
          <span class="title-icon">⚡</span>
          快捷工具
        </h2>
        
        <div class="tools-row">
          <a href="https://www.nnnu.edu.cn" target="_blank" class="tool-item glass">
            <span class="tool-icon">🏫</span>
            <span class="tool-name">学校官网</span>
          </a>
          
          <a href="https://wpp.nnnu.edu.cn" target="_blank" class="tool-item glass">
            <span class="tool-icon">💡</span>
            <span class="tool-name">电费充值</span>
          </a>
          
          <router-link to="/electricity/alerts" class="tool-item glass">
            <span class="tool-icon">🔔</span>
            <span class="tool-name">预警设置</span>
          </router-link>
          
          <router-link to="/electricity/heatmap" class="tool-item glass">
            <span class="tool-icon">📊</span>
            <span class="tool-name">用电分析</span>
          </router-link>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="glass-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="footer-logo">⚡</span>
          <span class="footer-text">powered by 君梦</span>
        </div>
        <div class="footer-contact">
          <span class="contact-label">联系我们:</span>
          <a href="mailto:653723921@qq.com" class="contact-email">653723921@qq.com</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Lightning, UserFilled, Setting, SwitchButton, ArrowRight, Plus, List, DataLine } from '@element-plus/icons-vue'

const userName = ref('同学')
const currentTime = ref('')
const currentDate = ref('')
let timeTimer = null

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style scoped>
.nav-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
  padding-bottom: 40px;
}

/* ===== 背景装饰 ===== */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.glass-ball {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 
    0 8px 32px rgba(0,0,0,0.1),
    inset 0 0 20px rgba(255,255,255,0.2);
}

.ball-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.ball-2 {
  width: 300px;
  height: 300px;
  bottom: 10%;
  left: -50px;
  animation: float 10s ease-in-out infinite reverse;
}

.ball-3 {
  width: 200px;
  height: 200px;
  top: 40%;
  right: 10%;
  animation: float 6s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* ===== 磨砂玻璃基础样式 ===== */
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 
    0 8px 32px rgba(0,0,0,0.1),
    inset 0 0 0 1px rgba(255,255,255,0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.15),
    inset 0 0 0 1px rgba(255,255,255,0.2);
}

/* ===== 头部 ===== */
.glass-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.4);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.icon-svg {
  width: 24px;
  height: 24px;
  color: white;
}

.brand-text {
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.avatar-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

/* ===== 主内容区 ===== */
.main-container {
  position: relative;
  z-index: 1;
  padding: 100px 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ===== 欢迎区 ===== */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 40px;
  margin-bottom: 32px;
}

.greeting {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.subtitle {
  font-size: 16px;
  color: rgba(255,255,255,0.8);
}

.time-display {
  text-align: right;
  color: white;
}

.time {
  font-size: 42px;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.date {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
}

/* ===== 功能导航 ===== */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.title-icon {
  font-size: 24px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.nav-card {
  position: relative;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.nav-card:hover .card-glow {
  opacity: 1;
}

.nav-card.featured {
  background: linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3));
}

.card-icon-wrapper {
  flex-shrink: 0;
}

.icon-bg {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.icon-bg.electricity {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-bg.affairs {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.icon-bg.votes {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-bg.placeholder {
  background: rgba(255,255,255,0.2);
}

.card-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.card-arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.nav-card:hover .card-arrow {
  background: rgba(255,255,255,0.3);
  transform: translateX(4px);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.card-badge.hot {
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: white;
  box-shadow: 0 4px 10px rgba(238,90,90,0.4);
}

.card-badge.new {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
  box-shadow: 0 4px 10px rgba(79,172,254,0.4);
}

/* 即将到来 */
.coming-soon {
  opacity: 0.7;
}

.coming-soon:hover {
  opacity: 0.9;
}

/* ===== 快捷工具 ===== */
.quick-tools {
  margin-top: 40px;
}

.tools-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 16px;
  text-decoration: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tool-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.tool-icon {
  font-size: 20px;
}

.tool-name {
  font-size: 14px;
}

/* ===== 页脚 ===== */
.glass-footer {
  margin-top: 40px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-logo {
  font-size: 20px;
}

.footer-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.footer-contact {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.contact-label {
  color: rgba(255, 255, 255, 0.6);
}

.contact-email {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.contact-email:hover {
  color: #f093fb;
  text-decoration: underline;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .glass-header {
    padding: 0 20px;
    height: 60px;
  }
  
  .brand-text {
    font-size: 18px;
  }
  
  .main-container {
    padding: 80px 20px 30px;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 24px;
  }
  
  .greeting {
    font-size: 24px;
  }
  
  .time-display {
    text-align: center;
  }
  
  .time {
    font-size: 32px;
  }
  
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .nav-card {
    padding: 20px;
  }
  
  .tools-row {
    gap: 12px;
  }
  
  .tool-item {
    padding: 12px 18px;
    font-size: 13px;
  }
}

@media (max-width: 380px) {
  .greeting {
    font-size: 20px;
  }
  
  .nav-card {
    flex-direction: column;
    text-align: center;
  }
  
  .card-arrow {
    display: none;
  }
}
</style>
