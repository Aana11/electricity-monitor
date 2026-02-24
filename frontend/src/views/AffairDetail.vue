<template>
  <div class="affair-detail-page">
    <nav class="simple-nav">
      <router-link to="/affairs" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回事务</span>
      </router-link>
      <h1>事务详情</h1>
      <div class="nav-actions">
        <el-dropdown v-if="isCreator" @command="handleCommand">
          <MoreFilled class="nav-icon" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <Edit class="menu-icon" /> 编辑
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <Delete class="menu-icon" /> 删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>

    <main class="detail-content" v-if="affair">
      <!-- 倒计时卡片 -->
      <div class="countdown-card glass" v-if="affair.deadline">
        <div class="countdown-label">距离截止还有</div>
        <div class="countdown-display" :class="timeStatusClass">
          <div class="countdown-value">{{ countdownText }}</div>
        </div>
        <div class="deadline-text">
          截止时间：{{ formatDateTime(affair.deadline) }}
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="info-card glass">
        <div class="info-header">
          <div class="priority-badge" :class="'p' + affair.priority">
            {{ getPriorityText(affair.priority) }}优先级
          </div>
          <div class="status-badge" :class="'s' + affair.status">
            {{ getStatusText(affair.status) }}
          </div>
        </div>

        <h2 class="affair-title">{{ affair.title }}</h2>
        
        <p class="affair-description" v-if="affair.description">
          {{ affair.description }}
        </p>

        <div class="info-meta">
          <div class="meta-item">
            <UserFilled class="meta-icon" />
            <span>创建人：{{ affair.creator_name }}</span>
          </div>
          <div class="meta-item">
            <Clock class="meta-icon" />
            <span>创建于：{{ formatDate(affair.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 成员列表 -->
      <div class="members-card glass">
        <div class="card-title">
          <span>👥 通知成员</span>
          <span class="member-count">{{ affair.members?.length || 0 }}人</span>
        </div>
        
        <div class="members-list">
          <div 
            v-for="member in affair.members" 
            :key="member.id"
            class="member-item"
            :class="{ unread: !member.is_read }"
          >
            <div class="member-avatar">
              {{ member.real_name?.charAt(0) || '?' }}
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.real_name }}</div>
              <div class="member-status">
                <span v-if="member.is_read">✓ 已读 {{ formatTime(member.read_at) }}</span>
                <span v-else class="unread-text">未读</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button 
          v-if="!isCreator && !hasRead"
          type="primary" 
          size="large" 
          @click="markAsRead"
          class="action-btn"
        >
          标记已读
        </el-button>
        
        <el-button 
          v-if="affair.status === 0 && isCreator"
          type="success" 
          size="large" 
          @click="markAsComplete"
          class="action-btn"
        >
          标记完成
        </el-button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MoreFilled, Edit, Delete, UserFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()

const affair = ref(null)
const currentUserId = ref(1) // 应从用户状态获取

const isCreator = computed(() => {
  return affair.value?.creator_id === currentUserId.value
})

const hasRead = computed(() => {
  const member = affair.value?.members?.find(m => m.user_id === currentUserId.value)
  return member?.is_read || false
})

const timeStatusClass = computed(() => {
  if (!affair.value?.deadline) return ''
  const diff = new Date(affair.value.deadline) - new Date()
  if (diff < 0) return 'expired'
  if (diff < 24 * 60 * 60 * 1000) return 'urgent'
  if (diff < 3 * 24 * 60 * 60 * 1000) return 'warning'
  return 'normal'
})

const countdownText = computed(() => {
  if (!affair.value?.deadline) return ''
  const diff = new Date(affair.value.deadline) - new Date()
  
  if (diff < 0) {
    const days = Math.floor(Math.abs(diff) / (24 * 60 * 60 * 1000))
    return `已过期${days}天`
  }
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时`
  return '不到1小时'
})

const getPriorityText = (p) => ['高', '中', '低'][p - 1] || '中'
const getStatusText = (s) => ['进行中', '已完成', '已取消'][s] || '进行中'

const formatDate = (d) => new Date(d).toLocaleDateString('zh-CN')
const formatDateTime = (d) => new Date(d).toLocaleString('zh-CN', { 
  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
})
const formatTime = (t) => t ? new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''

const loadAffair = async () => {
  try {
    const res = await api.get(`/affairs/${route.params.id}`)
    if (res.data.success) {
      affair.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const markAsRead = async () => {
  try {
    await api.post(`/affairs/${route.params.id}/read`)
    ElMessage.success('标记已读')
    loadAffair()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const markAsComplete = async () => {
  try {
    await api.put(`/affairs/${route.params.id}`, { status: 1 })
    ElMessage.success('已标记完成')
    loadAffair()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleCommand = async (cmd) => {
  if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定删除此事务吗？', '提示', { type: 'warning' })
      await api.delete(`/affairs/${route.params.id}`)
      ElMessage.success('删除成功')
      router.push('/affairs')
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('删除失败')
    }
  }
}

onMounted(loadAffair)
</script>

<style scoped>
.affair-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

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
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  text-decoration: none;
  flex-shrink: 0;
  white-space: nowrap;
}

.simple-nav h1 {
  font-size: 18px;
  color: #1a202c;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
  cursor: pointer;
}

.detail-content {
  padding: 80px 20px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 16px;
}

/* 倒计时卡片 */
.countdown-card {
  text-align: center;
}

.countdown-label {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 12px;
}

.countdown-display {
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 12px;
}

.countdown-display.normal {
  background: rgba(16, 185, 129, 0.2);
}

.countdown-display.warning {
  background: rgba(245, 158, 11, 0.2);
}

.countdown-display.urgent {
  background: rgba(239, 68, 68, 0.2);
  animation: pulse 1.5s ease-in-out infinite;
}

.countdown-display.expired {
  background: rgba(107, 114, 128, 0.2);
}

.countdown-value {
  font-size: 36px;
  font-weight: 700;
  color: white;
}

.deadline-text {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

/* 信息卡片 */
.info-card .info-header {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-badge.p1 { background: #fee2e2; color: #ef4444; }
.priority-badge.p2 { background: #fef3c7; color: #f59e0b; }
.priority-badge.p3 { background: #d1fae5; color: #10b981; }

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-badge.s0 { background: rgba(255,255,255,0.2); color: white; }
.status-badge.s1 { background: #d1fae5; color: #10b981; }
.status-badge.s2 { background: #fee2e2; color: #ef4444; }

.affair-title {
  font-size: 22px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.affair-description {
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  line-height: 1.6;
  margin-bottom: 20px;
}

.info-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-icon {
  width: 16px;
  height: 16px;
}

/* 成员卡片 */
.members-card .card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: white;
  margin-bottom: 16px;
}

.member-count {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
}

.member-item.unread {
  border-left: 3px solid #f59e0b;
}

.member-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.member-info {
  flex: 1;
}

.member-name {
  color: white;
  font-weight: 500;
  margin-bottom: 2px;
}

.member-status {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.unread-text {
  color: #f59e0b;
}

/* 操作按钮 */
.actions {
  margin-top: 24px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
