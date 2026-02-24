<template>
  <div class="task-detail-page">
    <nav class="simple-nav">
      <div class="back-link" @click="router.back()">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </div>
      <h1>📋 分工详情</h1>
      <div class="nav-actions">
        <button v-if="task && task.status === 0 && isCreator" class="end-btn" @click="handleEndTask">
          结束分工
        </button>
      </div>
    </nav>

    <main class="detail-content" v-if="task">
      <!-- 分工信息 -->
      <div class="task-info glass">
        <div class="info-header">
          <div class="status-badge" :class="task.status === 1 ? 'ended' : 'active'">
            {{ task.status === 1 ? '已完成' : '进行中' }}
          </div>
          <div class="creator-info">
            <User class="creator-icon" />
            <span>{{ task.creator_name || '未知' }}</span>
          </div>
        </div>
        
        <h2 class="task-title">{{ task.title }}</h2>
        <p v-if="task.description" class="task-desc">{{ task.description }}</p>
        
        <div class="task-stats">
          <div class="stat-item">
            <Document class="stat-icon" />
            <span>{{ task.options?.length || 0 }} 项</span>
          </div>
          <div class="stat-item">
            <Clock class="stat-icon" />
            <span>{{ formatDate(task.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 分工选项 -->
      <div class="options-section">
        <h3 class="section-title">分工选择</h3>
        
        <div v-if="task.status === 0 && !task.user_chosen && !loading" class="choosing-area">
          <p class="choose-hint">请选择你要承担的分工：</p>
          
          <div 
            v-for="option in task.options" 
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
          
          <button class="submit-btn" @click="submitChoice" :disabled="!selectedOption">
            确认选择
          </button>
        </div>
        
        <div v-else-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>提交中...</p>
        </div>
        
        <!-- 已选择或已结束 -->
        <div v-else class="results-area">
          <div 
            v-for="option in task.options" 
            :key="option.id"
            class="result-card glass"
          >
            <div class="result-info">
              <span class="result-content">{{ option.content }}</span>
              <span v-if="option.assigned_name" class="result-assigned">
                👤 {{ option.assigned_name }}
              </span>
              <span v-else class="result-unassigned">待认领</span>
            </div>
            
            <div v-if="task.user_chosen === option.id" class="chosen-badge">
              <Check class="check-icon" /> 您选择的分工
            </div>
          </div>
          
          <div v-if="task.user_chosen" class="chosen-notice">
            <Check class="notice-icon" /> 您已选择分工
          </div>
          <div v-else-if="task.status === 0" class="closed-notice">
            分工选择已结束
          </div>
        </div>
      </div>
    </main>

    <!-- 加载状态 -->
    <div v-else class="loading-page">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, User, Check, Document, Clock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const task = ref(null)
const selectedOption = ref(null)
const loading = ref(false)

const isCreator = computed(() => {
  const userId = JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}'))?.userId
  return task.value && userId === task.value.creator_id
})

const fetchTask = async () => {
  const token = localStorage.getItem('token')
  try {
    const response = await fetch(`/api/tasks/${route.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    if (result.success) {
      task.value = result.data
    } else {
      ElMessage.error(result.error || '获取失败')
      router.back()
    }
  } catch (error) {
    console.error('获取分工失败:', error)
    ElMessage.error('获取失败')
    router.back()
  }
}

const submitChoice = async () => {
  if (!selectedOption.value) {
    ElMessage.warning('请选择一个分工')
    return
  }
  
  loading.value = true
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`/api/tasks/${task.value.id}/choose`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ option_id: selectedOption.value })
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('选择成功')
      fetchTask()
    } else {
      ElMessage.error(result.error || '选择失败')
    }
  } catch (error) {
    console.error('选择失败:', error)
    ElMessage.error('选择失败')
  } finally {
    loading.value = false
  }
}

const handleEndTask = async () => {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`/api/tasks/${task.value.id}/close`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('分工已结束')
      fetchTask()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    console.error('结束分工失败:', error)
    ElMessage.error('操作失败')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchTask()
})
</script>

<style scoped>
.task-detail-page {
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

.task-info {
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

.task-title {
  font-size: 22px;
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
}

.task-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.task-stats {
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

.choose-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 16px;
}

.choosing-area {
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

.submit-btn {
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
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
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-content {
  font-size: 15px;
  color: white;
  font-weight: 500;
}

.result-assigned {
  color: #a5b4fc;
  font-size: 14px;
}

.result-unassigned {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.chosen-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  color: #a5b4fc;
  font-size: 12px;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.chosen-notice,
.closed-notice {
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

.closed-notice {
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
