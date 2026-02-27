<template>
  <div class="vote-detail-page">
    <!-- 顶部导航 -->
    <nav class="nav-bar">
      <button class="back-btn" @click="router.back()">
        ← 返回
      </button>
      <h1>投票详情</h1>
      <div class="placeholder"></div>
    </nav>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="loadVote">重新加载</button>
    </div>

    <!-- 投票内容 -->
    <div v-else-if="vote" class="vote-content">
      <!-- 投票信息卡片 -->
      <div class="vote-card">
        <div class="vote-header">
          <span class="status-badge" :class="vote.status === 1 ? 'ended' : 'active'">
            {{ vote.status === 1 ? '已结束' : '进行中' }}
          </span>
          <span class="creator">创建者: {{ vote.creator_name || '未知' }}</span>
        </div>
        
        <h2 class="vote-title">{{ vote.title }}</h2>
        <p v-if="vote.description" class="vote-desc">{{ vote.description }}</p>
        
        <div class="vote-stats">
          <span>总票数: {{ vote.vote_count || 0 }}</span>
          <span>选项数: {{ vote.options?.length || 0 }}</span>
        </div>
      </div>

      <!-- 投票选项 -->
      <div class="options-section">
        <h3>投票选项</h3>
        
        <!-- 未投票状态 -->
        <div v-if="canVote" class="voting-area">
          <div 
            v-for="option in vote.options" 
            :key="option.id"
            class="option-item"
            :class="{ selected: selectedOption === option.id }"
            @click="selectedOption = option.id"
          >
            <div class="radio"></div>
            <span>{{ option.content }}</span>
          </div>
          
          <button 
            class="submit-btn"
            :disabled="!selectedOption"
            @click="submitVote"
          >
            提交投票
          </button>
        </div>

        <!-- 已投票或结束 - 显示结果 -->
        <div v-else class="results-area">
          <div 
            v-for="option in vote.options" 
            :key="option.id"
            class="result-item"
            :class="{ winner: isWinner(option), myVote: vote.user_voted === option.id }"
          >
            <div class="result-info">
              <span>{{ option.content }}</span>
              <span class="count">{{ option.vote_count || 0 }} 票</span>
            </div>
            <div class="progress-bar">
              <div class="progress" :style="{ width: getPercent(option) + '%' }"></div>
            </div>
            <span v-if="vote.user_voted === option.id" class="my-vote-tag">✓ 你的选择</span>
          </div>
          
          <div class="vote-status">
            <span v-if="vote.user_voted">✅ 你已投票</span>
            <span v-else-if="vote.status === 1">投票已结束</span>
          </div>
        </div>
      </div>

      <!-- 结束投票按钮 -->
      <button 
        v-if="isCreator && vote.status === 0"
        class="end-vote-btn"
        @click="endVote"
      >
        结束投票
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const vote = ref(null)
const loading = ref(true)
const error = ref('')
const selectedOption = ref(null)

const isCreator = computed(() => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return false
    const payload = JSON.parse(atob(token.split('.')[1]))
    return vote.value && payload.userId === vote.value.creator_id
  } catch {
    return false
  }
})

const canVote = computed(() => {
  return vote.value && vote.value.status === 0 && !vote.value.user_voted
})

const loadVote = async () => {
  loading.value = true
  error.value = ''
  
  const token = localStorage.getItem('token')
  if (!token) {
    error.value = '请先登录'
    loading.value = false
    return
  }
  
  try {
    const res = await fetch(`/api/votes/${route.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    if (data.success) {
      vote.value = data.data
    } else {
      error.value = data.error || '获取失败'
    }
  } catch (e) {
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
}

const submitVote = async () => {
  if (!selectedOption.value) return
  
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`/api/votes/${vote.value.id}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ option_id: selectedOption.value })
    })
    const data = await res.json()
    
    if (data.success) {
      ElMessage.success('投票成功')
      loadVote()
    } else {
      ElMessage.error(data.error || '投票失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const endVote = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`/api/votes/${vote.value.id}/close`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    if (data.success) {
      ElMessage.success('投票已结束')
      loadVote()
    } else {
      ElMessage.error(data.error || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const getPercent = (option) => {
  const total = vote.value?.vote_count || 0
  if (!total) return 0
  return Math.round(((option.vote_count || 0) / total) * 100)
}

const isWinner = (option) => {
  if (vote.value?.status !== 1) return false
  const maxVotes = Math.max(...(vote.value.options || []).map(o => o.vote_count || 0))
  return (option.vote_count || 0) === maxVotes && maxVotes > 0
}

onMounted(() => {
  loadVote()
})
</script>

<style scoped>
.vote-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  cursor: pointer;
}

.nav-bar h1 {
  color: white;
  font-size: 18px;
  margin: 0;
}

.placeholder {
  width: 80px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state button {
  margin-top: 16px;
  padding: 10px 24px;
  background: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.vote-content {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.vote-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.vote-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-badge.active {
  background: #4ade80;
  color: #166534;
}

.status-badge.ended {
  background: #9ca3af;
  color: white;
}

.creator {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.vote-title {
  color: white;
  font-size: 22px;
  margin: 0 0 12px 0;
}

.vote-desc {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.vote-stats {
  display: flex;
  gap: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.options-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.options-section h3 {
  color: white;
  margin: 0 0 16px 0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.option-item.selected {
  background: rgba(102, 126, 234, 0.5);
  border: 1px solid rgba(102, 126, 234, 0.8);
}

.radio {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.option-item.selected .radio {
  background: white;
  border-color: white;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
  position: relative;
}

.result-item.winner {
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(102, 126, 234, 0.5);
}

.result-item.myVote {
  border-left: 4px solid #4ade80;
}

.result-info {
  display: flex;
  justify-content: space-between;
  color: white;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.my-vote-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #4ade80;
  color: #166534;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.vote-status {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.end-vote-btn {
  width: 100%;
  padding: 16px;
  background: rgba(239, 68, 68, 0.8);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}
</style>
