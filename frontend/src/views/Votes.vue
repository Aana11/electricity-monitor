<template>
  <div class="votes-page">
    <nav class="simple-nav">
      <router-link to="/" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>🗳️ 投票与分工</h1>
      <div class="nav-actions">
        <button class="create-btn" @click="openCreateDialog">
          <Plus class="btn-icon" />
          <span>发起</span>
        </button>
      </div>
    </nav>

    <main class="votes-content">
      <!-- 标签切换 -->
      <div class="type-tabs">
        <div 
          class="type-tab" 
          :class="{ active: currentType === 'vote' }"
          @click="currentType = 'vote'"
        >
          <DataLine class="tab-icon" />
          <span>投票</span>
        </div>
        <div 
          class="type-tab" 
          :class="{ active: currentType === 'task' }"
          @click="currentType = 'task'"
        >
          <List class="tab-icon" />
          <span>分工</span>
        </div>
      </div>

      <!-- 列表 -->
      <div class="items-list">
        <!-- 投票列表 -->
        <template v-if="currentType === 'vote'">
          <div v-if="votes.length === 0" class="empty-state">
            <DataLine class="empty-icon" />
            <p>暂无投票</p>
            <button class="create-first-btn" @click="openCreateDialog(); currentType = 'vote'">
              发起第一个投票
            </button>
          </div>
          <div 
            v-for="vote in votes" 
            :key="vote.id"
            class="item-card glass"
            :class="{ ended: vote.status === 1 }"
            @click="openVoteDetail(vote)"
          >
            <div class="item-header">
              <div class="item-badge" :class="vote.status === 1 ? 'ended' : 'active'">
                {{ vote.status === 1 ? '已结束' : '进行中' }}
              </div>
              <div class="item-meta">
                <User class="meta-icon" />
                <span>{{ vote.creator_name || '未知' }}</span>
              </div>
            </div>
            <h3 class="item-title">{{ vote.title }}</h3>
            <p v-if="vote.description" class="item-desc">{{ vote.description }}</p>
            <div class="item-footer">
              <div class="item-stats">
                <span class="stat">
                  <Check class="stat-icon" />
                  {{ vote.vote_count || 0 }} 票
                </span>
                <span class="stat">
                  <Document class="stat-icon" />
                  {{ vote.option_count || 0 }} 选项
                </span>
              </div>
              <div class="item-arrow">
                <ArrowRight class="arrow-icon" />
              </div>
            </div>
          </div>
        </template>

        <!-- 分工列表 -->
        <template v-else>
          <div v-if="tasks.length === 0" class="empty-state">
            <List class="empty-icon" />
            <p>暂无分工</p>
            <button class="create-first-btn" @click="openCreateDialog(); currentType = 'task'">
              发起第一个分工
            </button>
          </div>
          <div 
            v-for="task in tasks" 
            :key="task.id"
            class="item-card glass"
            :class="{ ended: task.status === 1 }"
            @click="openTaskDetail(task)"
          >
            <div class="item-header">
              <div class="item-badge" :class="task.status === 1 ? 'ended' : 'active'">
                {{ task.status === 1 ? '已完成' : '进行中' }}
              </div>
              <div class="item-meta">
                <User class="meta-icon" />
                <span>{{ task.creator_name || '未知' }}</span>
              </div>
            </div>
            <h3 class="item-title">{{ task.title }}</h3>
            <p v-if="task.description" class="item-desc">{{ task.description }}</p>
            <div class="item-footer">
              <div class="item-stats">
                <span class="stat">
                  <Document class="stat-icon" />
                  {{ task.option_count || 0 }} 项
                </span>
              </div>
              <div class="item-arrow">
                <ArrowRight class="arrow-icon" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- 创建弹窗 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="create-dialog glass">
        <div class="dialog-header">
          <h2>{{ createType === 'vote' ? '🗳️ 创建投票' : '📋 创建分工' }}</h2>
          <button class="close-btn" @click="showCreateDialog = false">
            <Close class="close-icon" />
          </button>
        </div>
        
        <div class="dialog-body">
          <!-- 标题 -->
          <div class="form-field">
            <label class="field-label">{{ createType === 'vote' ? '投票标题' : '分工标题' }}</label>
            <input 
              v-model="createForm.title" 
              class="glass-input"
              :placeholder="createType === 'vote' ? '例如：今晚吃什么？' : '例如：卫生值日表'"
            />
          </div>

          <!-- 描述 -->
          <div class="form-field">
            <label class="field-label">描述（可选）</label>
            <textarea 
              v-model="createForm.description" 
              class="glass-input glass-textarea"
              placeholder="补充说明..."
              rows="2"
            ></textarea>
          </div>

          <!-- 投票类型 -->
          <div v-if="createType === 'vote'" class="form-field">
            <label class="field-label">投票方式</label>
            <div class="option-type-selector">
              <div 
                class="type-option" 
                :class="{ active: createForm.voteType === 'single' }"
                @click="createForm.voteType = 'single'"
              >
                <span>🙋</span>
                <span>单选</span>
              </div>
              <div 
                class="type-option" 
                :class="{ active: createForm.voteType === 'multi' }"
                @click="createForm.voteType = 'multi'"
              >
                <span>🙋‍♀️</span>
                <span>多选</span>
              </div>
            </div>
            <label class="checkbox-label">
              <input type="checkbox" v-model="createForm.requireMajority" />
              <span>要求超过半数参与者同意</span>
            </label>
          </div>

          <!-- 参与成员 -->
          <div class="form-field">
            <label class="field-label">
              参与成员
              <span class="label-tip">（选择参与的室友）</span>
            </label>
            <div v-if="roomMembers.length > 0" class="member-options">
              <div 
                v-for="member in roomMembers" 
                :key="member.id"
                class="member-btn"
                :class="{ active: createForm.members.includes(member.id) }"
                @click="toggleMember(member.id)"
              >
                <span class="member-avatar">{{ member.real_name?.charAt(0) || '?' }}</span>
                <span class="member-name">{{ member.real_name || '未知' }}</span>
              </div>
            </div>
            <div v-else class="no-members">暂无室友信息</div>
          </div>

          <!-- 选项 -->
          <div class="form-field">
            <label class="field-label">
              {{ createType === 'vote' ? '投票选项' : '分工选项' }}
              <span class="label-tip">（每行一个）</span>
            </label>
            <textarea 
              v-model="createForm.optionsText" 
              class="glass-input glass-textarea"
              :placeholder="createType === 'vote' ? '火锅\n炒菜\n烧烤\n披萨' : '周一\n周二\n周三\n周四\n周五\n周六'"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="glass-btn secondary" @click="showCreateDialog = false">取消</button>
          <button class="glass-btn primary" @click="handleCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Plus, DataLine, List, User, Check, Document, Close } from '@element-plus/icons-vue'

const router = useRouter()

const currentType = ref('vote')
const showCreateDialog = ref(false)
const createType = ref('vote')

const votes = ref([])
const tasks = ref([])

const createForm = ref({
  title: '',
  description: '',
  voteType: 'single',
  requireMajority: false,
  optionsText: '',
  members: []
})

// 成员列表
const roomMembers = ref([])

// 获取成员列表
const fetchMembers = async () => {
  const token = localStorage.getItem('token')
  console.log('获取成员 - Token存在:', !!token)
  console.log('获取成员 - Token:', token ? token.substring(0, 20) + '...' : '无')
  try {
    const response = await fetch('/api/affairs/members/room', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const result = await response.json()
    console.log('成员API响应:', result)
    if (result.success) {
      roomMembers.value = result.data || []
      console.log('成员列表:', roomMembers.value)
    } else {
      console.error('获取成员失败:', result.error)
    }
  } catch (error) {
    console.error('获取成员失败:', error)
  }
}

// 切换成员选择
const toggleMember = (userId) => {
  const index = createForm.value.members.indexOf(userId)
  if (index === -1) {
    createForm.value.members.push(userId)
  } else {
    createForm.value.members.splice(index, 1)
  }
}

// 获取数据
const fetchData = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  
  try {
    // 先获取投票
    const votesRes = await fetch('/api/votes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const votesData = await votesRes.json()
    console.log('投票数据:', votesData)
    
    if (votesData.success) {
      votes.value = votesData.data || []
      console.log('设置votes:', votes.value.length, '条')
    }
    
    // 再获取分工
    const tasksRes = await fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const tasksData = await tasksRes.json()
    if (tasksData.success) {
      tasks.value = tasksData.data || []
    }
  } catch (error) {
    console.error('获取失败:', error)
  }
}

// 创建
const handleCreate = async () => {
  console.log('=== 创建开始 ===')
  console.log('标题:', createForm.value.title)
  console.log('类型:', createType.value)
  console.log('选项:', createForm.value.optionsText)
  console.log('成员:', createForm.value.members)
  
  if (!createForm.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  
  const options = createForm.value.optionsText
    .split('\n')
    .map(o => o.trim())
    .filter(o => o)
  
  console.log('解析后选项:', options)
  
  if (options.length < (createType.value === 'vote' ? 2 : 1)) {
    ElMessage.warning(createType.value === 'vote' ? '至少2个选项' : '至少1个选项')
    return
  }
  
  const token = localStorage.getItem('token')
  console.log('Token存在:', !!token)
  
  const endpoint = createType.value === 'vote' ? '/api/votes' : '/api/tasks'
  console.log('Endpoint:', endpoint)
  
  const body = {
    title: createForm.value.title,
    description: createForm.value.description,
    options
  }
  
  if (createType.value === 'vote') {
    body.type = createForm.value.voteType
    body.require_majority = createForm.value.requireMajority
  }
  
  console.log('请求体:', body)
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const result = await response.json()
    console.log('创建响应:', result)
    
    if (result.success) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      createForm.value = {
        title: '',
        description: '',
        voteType: 'single',
        requireMajority: false,
        optionsText: ''
      }
      // 强制刷新列表
      votes.value = []
      tasks.value = []
      await fetchData()
    } else {
      ElMessage.error(result.error || '创建失败')
    }
  } catch (error) {
    console.error('创建失败:', error)
    ElMessage.error('创建失败')
  }
}

const openVoteDetail = (vote) => {
  router.push(`/votes/${vote.id}`)
}

const openTaskDetail = (task) => {
  router.push(`/votes/task/${task.id}`)
}

// 监听弹窗类型
const openCreateDialog = () => {
  createType.value = currentType.value
  createForm.value = {
    title: '',
    description: '',
    voteType: 'single',
    requireMajority: false,
    optionsText: '',
    members: []
  }
  fetchMembers()
  showCreateDialog.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.votes-page {
  min-height: 100vh;
  padding-bottom: 40px;
}

/* 导航栏 */
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
  text-decoration: none;
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

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 内容区 */
.votes-content {
  padding: 20px;
}

/* 标签切换 */
.type-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  font-weight: 500;
}

.type-tab:hover {
  color: rgba(255, 255, 255, 0.9);
}

.type-tab.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  width: 20px;
  height: 20px;
}

/* 列表 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-card {
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.1);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

.item-card.ended {
  opacity: 0.6;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.item-badge.active {
  background: rgba(102, 126, 234, 0.3);
  color: #a5b4fc;
}

.item-badge.ended {
  background: rgba(100, 100, 100, 0.3);
  color: rgba(255, 255, 255, 0.6);
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.item-title {
  font-size: 17px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.item-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.stat-icon {
  width: 14px;
  height: 14px;
}

.item-arrow .arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

.create-first-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

/* 弹窗 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.create-dialog {
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(30, 32, 60, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(40, 42, 70, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.close-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.dialog-body {
  padding: 24px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(40, 42, 70, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 表单 */
.form-field {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
}

.label-tip {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.glass-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.glass-input:focus {
  border-color: rgba(102, 126, 234, 0.7);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.glass-textarea {
  resize: vertical;
  min-height: 80px;
}

.option-type-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.type-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-option:hover {
  background: rgba(255, 255, 255, 0.12);
}

.type-option.active {
  background: rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.5);
  color: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

/* 按钮 */
.glass-btn {
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.glass-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.glass-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.glass-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.glass-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 成员选择 */
.member-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.member-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.member-btn.active {
  background: rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.5);
  color: #fff;
}

.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.member-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-members {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  padding: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
</style>
