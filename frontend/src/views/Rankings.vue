<template>
  <div class="rankings-page">
    <nav class="simple-nav">
      <router-link to="/electricity" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>🏆 排行榜</h1>
      <div class="nav-placeholder"></div>
    </nav>
    
    <main class="rankings-content">
      <el-tabs v-model="activeTab" type="border-card" class="rankings-tabs">
        <!-- 余额排行 -->
        <el-tab-pane label="💰 余额告急" name="balance">
          <div class="ranking-list">
            <div 
              v-for="(item, index) in balanceRankings" 
              :key="item.id"
              class="ranking-item"
              :class="getRankClass(index)"
            >
              <div class="rank-number">{{ index + 1 }}</div>
              
              <div class="rank-info">
                <div class="room-name">{{ item.room_name || '未绑定宿舍' }}</div>
                <div class="user-name" v-if="item.real_name">{{ formatMembers(item.real_name) }}</div>
              </div>
              
              <div class="rank-value" :class="{ danger: item.balance < 20 }">
                <span class="currency">¥</span>
                <span class="amount">{{ item.balance?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <!-- 用电排行 -->
        <el-tab-pane label="⚡ 用电排行" name="usage">
          <div class="ranking-list">
            <div 
              v-for="(item, index) in usageRankings" 
              :key="item.id"
              class="ranking-item"
              :class="getRankClass(index)"
            >
              <div class="rank-number">{{ index + 1 }}</div>
              
              <div class="rank-info">
                <div class="room-name">{{ item.room_name || '未绑定宿舍' }}</div>
                <div class="user-name" v-if="item.real_name">{{ formatMembers(item.real_name) }}</div>
              </div>
              
              <div class="rank-value">
                <span class="amount">{{ item.used_kwh?.toFixed(2) || '0.00' }}</span>
                <span class="unit">kWh</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </main>
    
    <!-- 手机端底部导航 -->
    <nav class="mobile-nav">
      <router-link to="/electricity" class="mobile-nav-item">
        <DataLine class="mobile-nav-icon" />
        <span>概览</span>
      </router-link>
      <router-link to="/electricity/analysis" class="mobile-nav-item">
        <TrendCharts class="mobile-nav-icon" />
        <span>分析</span>
      </router-link>
      <router-link to="/electricity/rankings" class="mobile-nav-item active">
        <Trophy class="mobile-nav-icon" />
        <span>排行榜</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeft, DataLine, TrendCharts, Trophy } from '@element-plus/icons-vue'
import { rankingApi } from '../api/index.js'

const activeTab = ref('balance')
const balanceRankings = ref([])
const usageRankings = ref([])

const getRankClass = (index) => {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

// 格式化成员显示
const formatMembers = (members) => {
  if (!members) return ''
  const list = members.split(',')
  if (list.length === 1) return list[0]
  if (list.length === 2) return list[0] + '、' + list[1]
  return list[0] + '等' + list.length + '人'
}

const loadRankings = async () => {
  try {
    const [balanceRes, usageRes] = await Promise.all([
      rankingApi.getBalanceRank(),
      rankingApi.getUsageRank()
    ])
    
    if (balanceRes.data.success) {
      balanceRankings.value = balanceRes.data.data
    }
    
    if (usageRes.data.success) {
      usageRankings.value = usageRes.data.data
    }
  } catch (error) {
    console.error('加载排行榜失败:', error)
  }
}

onMounted(loadRankings)
</script>

<style scoped>
.rankings-page {
  min-height: 100vh;
  padding-bottom: 70px;
}

/* 顶部导航 */
.simple-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.simple-nav h1 {
  font-size: 18px;
  color: #1a202c;
  font-weight: 600;
}

.nav-placeholder {
  width: 50px;
}

/* 内容区 */
.rankings-content {
  padding: 80px 24px 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 标签页 */
.rankings-tabs {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: #f8fafc;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0;
}

:deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  color: #718096;
}

:deep(.el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 3px;
}

/* 排行榜列表 */
.ranking-list {
  padding: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  gap: 16px;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item:hover {
  background: #f8fafc;
}

/* 排名数字 */
.rank-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 16px;
  background: #f0f0f0;
  color: #666;
  flex-shrink: 0;
}

.ranking-item.gold .rank-number {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
}

.ranking-item.silver .rank-number {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: white;
}

.ranking-item.bronze .rank-number {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: white;
}

/* 信息区 */
.rank-info {
  flex: 1;
  min-width: 0;
}

.room-name {
  font-weight: 600;
  color: #1a202c;
  font-size: 15px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-name {
  color: #718096;
  font-size: 13px;
}

/* 数值 */
.rank-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
  flex-shrink: 0;
}

.rank-value .currency {
  font-size: 14px;
}

.rank-value .amount {
  font-size: 20px;
}

.rank-value .unit {
  font-size: 12px;
  color: #718096;
}

.rank-value.danger {
  color: #f56565;
}

/* 手机端底部导航 */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 100;
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  color: #718096;
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mobile-nav-item.active {
  color: #667eea;
}

.mobile-nav-icon {
  width: 22px;
  height: 22px;
}

/* 响应式 */
@media (max-width: 640px) {
  .simple-nav {
    padding: 0 16px;
    height: 56px;
  }
  
  .simple-nav h1 {
    font-size: 16px;
  }
  
  .rankings-content {
    padding: 72px 12px 80px;
  }
  
  .ranking-item {
    padding: 14px 12px;
    gap: 12px;
  }
  
  .rank-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .room-name {
    font-size: 14px;
  }
  
  .rank-value {
    font-size: 16px;
  }
  
  .rank-value .amount {
    font-size: 18px;
  }
  
  /* 显示底部导航 */
  .mobile-nav {
    display: flex;
  }
}

@media (max-width: 380px) {
  .ranking-item {
    padding: 12px 10px;
  }
  
  .room-name {
    font-size: 13px;
  }
}
</style>
