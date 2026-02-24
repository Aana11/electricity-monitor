<template>
  <div class="vote-detail-page" :style="{ position: 'relative', zIndex: 9999 }">
    <nav class="simple-nav">
      <div class="back-link" @click="router.back()">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </div>
      <h1>🗳️ 投票详情</h1>
      <div class="nav-actions">
        <button v-if="vote && vote.status === 0 && isCreator" class="end-btn" @click="handleEndVote">
          结束投票
        </button>
      </div>
    </nav>

    <!-- 加载状态 -->
    <div v-if="!vote" class="loading-page">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <main v-else class="detail-content">
      <!-- 投票信息 -->
      <div class="vote-info glass">
        <div class="info-header">
          <div class="status-badge" :class="vote.status === 1 ? 'ended' : 'active'">
            {{ vote.status === 1 ? '已结束' : '进行中' }}
          </div>
          <div class="creator-info">
            <User class="creator-icon" />
            <span>{{ vote.creator_name || '未知' }}</span>
          </div>
        </div>
        
        <h2 class="vote-title">{{ vote.title }}</h2>
        <p v-if="vote.description" class="vote-desc">{{ vote.description }}</p>
        
        <div class="vote-stats">
          <div class="stat-item">
            <Check class="stat-icon" />
            <span>{{ vote.vote_count || 0 }} 票</span>
          </div>
          <div class="stat-item">
            <Document class="stat-icon" />
            <span>{{ vote.options?.length || 0 }} 选项</span>
          </div>
          <div class="stat-item">
            <Clock class="stat-icon" />
            <span>{{ formatDate(vote.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 投票选项 -->
      <div class="options-section">
        <h3 class="section-title">投票选项</h3>
        
        <div v-if="vote.status === 0 && !vote.user_voted && !loading" class="voting-area">
          <div 
            v-for="option in vote.options" 
            :key="option.id"
            class="option-card glass"
            :class="{ selected: selectedOption === option.id }"
            @click="selectedOption = option.id"
          >
            <div class="option-radio">
              <div class="radio-inner" :class="{ checked: selectedOption === option.id }"></div>
            </div>
            <span class="option-content">{{ option.content }}</span>
          </div>
          
          <button class="submit-vote-btn" @click="submitVote" :disabled="!selectedOption">
            确认投票
          </button>
        </div>
        
        <div v-else-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>提交中...</p>
        </div>
        
        <!-- 已投票或已结束 -->
        <div v-else class="results-area">
          <div 
            v-for="option in vote.options" 
            :key="option.id"
            class="result-card glass"
            :class="{ winner: isWinner(option) }"
          >
            <div class="result-info">
              <span class="result-content">{{ option.content }}</span>
              <span class="result-count">{{ option.vote_count || 0 }} 票</span>
            </div>
            <div class="result-bar">
              <div 
                class="result-fill" 
                :style="{ width: getPercentage(option) + '%' }"
                :class="{ winner: isWinner(option) }"
              ></div>
            </div>
            <div class="result-percent">{{ getPercentage(option) }}%</div>
            
            <!-- 显示投票者 -->
            <div v-if="vote.user_voted === option.id" class="voted-badge">
              <Check class="check-icon" /> 您投票的选项
            </div>
          </div>
          
          <div v-if="vote.user_voted" class="voted-notice">
            <Check class="notice-icon" /> 您已参与投票
          </div>
          <div v-else-if="vote.status === 0" class="voting-closed-notice">
            投票已结束
          </div>
        </div>
      </div>
    </main>

    <!-- 加载状态 - 备用 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, User, Check, Document, Clock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const vote = ref(null)
const selectedOption = ref(null)
const loading = ref(false)

const isCreator = computed(() => {
  const userId = JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}'))?.userId
  return vote.value && userId === vote.value.creator_id
})

const fetchVote = async () => {
  console.log('=== fetchVote 开始 ===')
  console.log('route.params.id:', route.params.id)
  
  const token = localStorage.getItem('token')
  console.log('Token存在:', !!token)
  
  if (!token) {
    console.log('没有token')
    return
  }
  
  try {
    console.log('正在获取投票详情, id:', route.params.id)
    const response = await fetch(`/api/votes/${route.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('响应状态:', response.status)
    
    const result = await response.json()
    console.log('响应结果:', result)
    
    if (result.success) {
      vote.value = result.data
      console.log('设置vote成功:', vote.value)
    } else {
      console.error('获取失败:', result.error)
      ElMessage.error(result.error || '获取失败')
    }
  } catch (error) {
    console.error('获取投票失败:', error)
    ElMessage.error('获取失败')
  }
}

const submitVote = async () => {
  if (!selectedOption.value) {
    ElMessage.warning('请选择一个选项')
    return
  }
  
  loading.value = true
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`/api/votes/${vote.value.id}/vote`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ option_id: selectedOption.value })
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('投票成功')
      fetchVote()
    } else {
      ElMessage.error(result.error || '投票失败')
    }
  } catch (error) {
    console.error('投票失败:', error)
    ElMessage.error('投票失败')
  } finally {
    loading.value = false
  }
}

const handleEndVote = async () => {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`/api/votes/${vote.value.id}/close`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('投票已结束')
      fetchVote()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    console.error('结束投票失败:', error)
    ElMessage.error('操作失败')
  }
}

const getPercentage = (option) => {
  const total = vote.value.vote_count || 0
  if (total === 0) return 0
  return Math.round(((option.vote_count || 0) / total) * 100)
}

const isWinner = (option) => {
  if (vote.value.status === 0) return false
  const maxVotes = Math.max(...(vote.value.options || []).map(o => o.vote_count || 0))
  return (option.vote_count || 0) === maxVotes && maxVotes > 0
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchVote()
})
</script>

<style scoped>
.vote-detail-page {
  min-height: 100vh;
  padding-bottom: 40px;
  position: relative;
  z-index: 1000;
  background: transparent;
}

.simple-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.simple-nav h1 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.end-btn {
  padding: 8px 16px;
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 20px;
  color: #ff8a8a;
  font-size: 13px;
  cursor: pointer;
}

.detail-content {
  padding: 20px;
}

.vote-info {
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 24px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(102, 126, 234, 0.3);
  color: #a5b4fc;
}

.status-badge.ended {
  background: rgba(100, 100, 100, 0.3);
  color: rgba(255, 255, 255, 0.6);
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.creator-icon {
  width: 14px;
  height: 14px;
}

.vote-title {
  font-size: 22px;
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
}

.vote-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.vote-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.stat-icon {
  width: 16px;
  height: 16px;
}

/* 选项区域 */
.options-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 16px 0;
}

.voting-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.option-card.selected {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
}

.option-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-inner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s ease;
}

.radio-inner.checked {
  background: #667eea;
}

.option-content {
  font-size: 15px;
  color: white;
}

.submit-vote-btn {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-vote-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 结果区域 */
.results-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.result-card.winner {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.1);
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.result-content {
  font-size: 15px;
  color: white;
  font-weight: 500;
}

.result-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.result-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.result-fill {
  height: 100%;
  background: rgba(102, 126, 234, 0.6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.result-fill.winner {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.result-percent {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  z-index: 1;
}

.voted-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  color: #a5b4fc;
  font-size: 12px;
  position: relative;
  z-index: 1;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.voted-notice,
.voting-closed-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  margin-top: 16px;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.notice-icon {
  width: 18px;
  height: 18px;
}

.voting-closed-notice {
  background: rgba(100, 100, 100, 0.15);
}

/* 加载 */
.loading-page,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: rgba(255, 255, 255, 0.5);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
