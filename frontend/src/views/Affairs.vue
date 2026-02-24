<template>
  <div class="affairs-page">
    <nav class="simple-nav">
      <router-link to="/" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>📋 宿舍事务</h1>
      <div class="nav-actions">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
          <Bell class="nav-icon" @click="showNotifications" />
        </el-badge>
      </div>
    </nav>

    <main class="affairs-content">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card glass">
          <div class="stat-value">{{ activeAffairs.length }}</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-card glass urgent">
          <div class="stat-value">{{ urgentAffairs.length }}</div>
          <div class="stat-label">紧急</div>
        </div>
        <div class="stat-card glass">
          <div class="stat-value">{{ unreadCount }}</div>
          <div class="stat-label">未读</div>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.value"
          class="filter-tab"
          :class="{ active: currentTab === tab.value }"
          @click="currentTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
        </div>
      </div>

      <!-- 事务列表 -->
      <div class="affairs-list">
        <div 
          v-for="affair in filteredAffairs" 
          :key="affair.id"
          class="affair-card glass"
          :class="[getPriorityClass(affair.priority), affair.time_status, { completed: affair.status === 1 }]"
        >
          <div class="affair-header">
            <div class="priority-badge" :class="'p' + affair.priority">
              {{ getPriorityText(affair.priority) }}
            </div>
            <div class="header-actions">
              <div class="time-badge" v-if="affair.deadline">
                <Countdown :deadline="affair.deadline" />
              </div>
              <el-dropdown @command="(cmd) => handleCardAction(cmd, affair)" @click.stop>
                <div class="more-btn" @click.stop>
                  <MoreFilled class="more-icon" />
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="complete" v-if="affair.status === 0">
                      <Check class="menu-icon" /> 标记完成
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <Delete class="menu-icon" /> 删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="affair-content" @click="goToDetail(affair.id)">
            <div class="affair-title">{{ affair.title }}</div>
            
            <div class="affair-desc" v-if="affair.description">
              {{ affair.description }}
            </div>
            
            <div class="affair-footer">
              <div class="creator">
                <UserFilled class="creator-icon" />
                <span>{{ affair.creator_name }}</span>
              </div>
              <div class="deadline" v-if="affair.deadline">
                <Clock class="deadline-icon" />
                <span>{{ formatDeadline(affair.deadline) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-if="filteredAffairs.length === 0">
          <span class="empty-icon">📝</span>
          <p>暂无{{ currentTab === 'all' ? '' : getTabLabel(currentTab) }}事务</p>
          <el-button type="primary" @click="showCreateDialog">创建第一个事务</el-button>
        </div>
      </div>
    </main>

    <!-- 创建按钮 -->
    <div class="fab" @click="showCreateDialog">
      <Plus class="fab-icon" />
    </div>

    <!-- 创建事务弹窗 -->
    <CreateAffairDialog 
      v-model="createDialogVisible"
      @success="onCreateSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Bell, UserFilled, Plus, Clock, MoreFilled, Delete, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Countdown from '../components/Countdown.vue'
import CreateAffairDialog from '../components/CreateAffairDialog.vue'
import api from '../api/index.js'

import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()

const affairs = ref([])
const unreadCount = ref(0)
const currentTab = ref('all')
const createDialogVisible = ref(false)
const currentUserId = computed(() => userStore.user?.id || 1)

const tabs = [
  { label: '全部', value: 'all', count: 0 },
  { label: '紧急', value: 'urgent', count: 0 },
  { label: '我的', value: 'mine', count: 0 },
  { label: '已完成', value: 'completed', count: 0 }
]

const activeAffairs = computed(() => affairs.value.filter(a => a.status === 0))

const completedAffairs = computed(() => affairs.value.filter(a => a.status === 1))

const urgentAffairs = computed(() => 
  affairs.value.filter(a => a.status === 0 && (a.time_status === 'urgent' || a.time_status === 'expired'))
)

const filteredAffairs = computed(() => {
  // 如果是已完成标签，显示已完成的事务
  if (currentTab.value === 'completed') {
    return affairs.value.filter(a => a.status === 1)
  }
  
  let result = affairs.value.filter(a => a.status === 0)
  
  switch (currentTab.value) {
    case 'urgent':
      return result.filter(a => Number(a.priority) === 2)
    case 'mine':
      return result.filter(a => a.creator_id === currentUserId.value)
    default:
      return result
  }
})

const getPriorityClass = (priority) => {
  return Number(priority) === 2 ? 'urgent' : 'normal'
}

const getPriorityText = (priority) => {
  return Number(priority) === 2 ? '紧急' : '日常'
}

const formatDeadline = (deadline) => {
  if (!deadline) return ''
  const date = new Date(deadline)
  const now = new Date()
  const diff = date - now
  
  if (diff < 0) return '已过期'
  if (diff < 24 * 60 * 60 * 1000) return '今天'
  if (diff < 2 * 24 * 60 * 60 * 1000) return '明天'
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const loadAffairs = async () => {
  try {
    const res = await api.get('/affairs')
    if (res.data.success) {
      affairs.value = res.data.data
      unreadCount.value = res.data.unreadCount || 0
    }
  } catch (error) {
    console.error('加载事务失败:', error)
  }
}

const showCreateDialog = () => {
  createDialogVisible.value = true
}

const onCreateSuccess = () => {
  loadAffairs()
}

const goToDetail = (id) => {
  router.push(`/affairs/${id}`)
}

const handleCardAction = async (cmd, affair) => {
  if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定删除此事务吗？', '提示', { type: 'warning' })
      await api.delete(`/affairs/${affair.id}`)
      ElMessage.success('删除成功')
      loadAffairs()
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('删除失败')
    }
  } else if (cmd === 'complete') {
    try {
      await api.put(`/affairs/${affair.id}`, { status: 1 })
      ElMessage.success('已标记完成')
      loadAffairs()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }
}

const getTabLabel = (tab) => {
  const labels = { urgent: '紧急', high: '高优先级', mine: '我的' }
  return labels[tab] || ''
}

const showNotifications = () => {
  // 显示通知列表
}

onMounted(() => {
  loadAffairs()
})
</script>

<style scoped>
.affairs-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 70px;
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
  font-weight: 500;
}

.simple-nav h1 {
  font-size: 18px;
  color: #1a202c;
}

.nav-actions {
  cursor: pointer;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.affairs-content {
  padding: 80px 20px 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 20px;
  border-radius: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-card.urgent {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(238, 90, 90, 0.2));
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.stat-card.urgent .stat-value,
.stat-card.urgent .stat-label {
  color: #ff6b6b;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 6px;
  font-weight: 500;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-tab {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.2);
}

.filter-tab.active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.tab-badge {
  background: #ff6b6b;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

/* 事务列表 */
.affairs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.affair-card {
  padding: 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.affair-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.affair-card.normal {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.affair-card.urgent {
  border: 1px solid rgba(255, 107, 107, 0.4);
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.05));
}

.affair-card.expired {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

/* 已完成事务样式 */
.affair-card.completed {
  opacity: 0.7;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.affair-card.completed .affair-title {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.5);
}

.affair-card.completed .affair-desc {
  color: rgba(255, 255, 255, 0.4);
}

.affair-card.completed .priority-badge {
  background: rgba(100, 100, 100, 0.3) !important;
  color: rgba(255, 255, 255, 0.5) !important;
}

.affair-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.more-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.more-icon {
  width: 16px;
  height: 16px;
  color: white;
}

.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.affair-content {
  cursor: pointer;
}

.priority-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.priority-badge.p1 {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.priority-badge.p2 {
  background: rgba(255, 107, 107, 0.25);
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.4);
}

.time-badge {
  font-size: 13px;
  color: white;
  font-weight: 500;
}

.affair-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.affair-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  line-height: 1.5;
}

.affair-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.creator,
.deadline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.creator-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.deadline-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* 悬浮按钮 */
.fab {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  z-index: 99;
}

.fab-icon {
  width: 24px;
  height: 24px;
  color: white;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  margin-bottom: 20px;
  opacity: 0.9;
}

@media (max-width: 640px) {
  .fab {
    bottom: 20px;
  }
}
</style>
