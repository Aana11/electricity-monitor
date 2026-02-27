<template>
  <div class="votes-page">
    <nav class="simple-nav">
      <router-link to="/" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>🗳️ 投票与抽签</h1>
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
          :class="{ active: currentType === 'lottery' }"
          @click="currentType = 'lottery'"
        >
          <List class="tab-icon" />
          <span>抽签</span>
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
          >
            <div class="item-header">
              <div class="item-badge" :class="vote.status === 1 ? 'ended' : 'active'">
                {{ vote.status === 1 ? '已结束' : '进行中' }}
              </div>
              <div class="item-actions">
                <el-dropdown trigger="click" @command="(cmd) => handleVoteAction(cmd, vote)">
                  <div class="kebab-menu" @click.stop>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
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
            </div>
            <div @click="openVoteDetail(vote)">
              <div class="item-meta">
                <User class="meta-icon" />
                <span>{{ vote.creator_name || '未知' }}</span>
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
          </div>
        </template>

        <!-- 抽签列表 -->
        <template v-else>
          <div v-if="lotterys.length === 0" class="empty-state">
            <List class="empty-icon" />
            <p>暂无抽签</p>
            <button class="create-first-btn" @click="openCreateDialog(); currentType = 'lottery'">
              发起第一个抽签
            </button>
          </div>
          <div 
            v-for="lottery in lotterys" 
            :key="lottery.id"
            class="item-card glass"
            :class="{ ended: lottery.status === 1 }"
          >
            <div class="item-header">
              <div class="item-badge" :class="lottery.status === 1 ? 'ended' : 'active'">
                {{ lottery.status === 1 ? '已完成' : '进行中' }}
              </div>
              <div class="item-actions">
                <el-dropdown trigger="click" @command="(cmd) => handleTaskAction(cmd, lottery)">
                  <div class="kebab-menu" @click.stop>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
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
            </div>
            <div @click="openTaskDetail(lottery)">
              <div class="item-meta">
                <User class="meta-icon" />
                <span>{{ lottery.creator_name || '未知' }}</span>
              </div>
              <h3 class="item-title">{{ lottery.title }}</h3>
              <p v-if="lottery.description" class="item-desc">{{ lottery.description }}</p>
              <div class="item-footer">
                <div class="item-stats">
                  <span class="stat">
                    <Document class="stat-icon" />
                    {{ lottery.option_count || 0 }} 项
                  </span>
                </div>
                <div class="item-arrow">
                  <ArrowRight class="arrow-icon" />
                </div>
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
          <h2>{{ createType === 'vote' ? '🗳️ 创建投票' : '📋 创建抽签' }}</h2>
          <button class="close-btn" @click="showCreateDialog = false">
            <Close class="close-icon" />
          </button>
        </div>
        
        <div class="dialog-body">
          <!-- 标题 -->
          <div class="form-field">
            <label class="field-label">{{ createType === 'vote' ? '投票标题' : '抽签标题' }}</label>
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
              {{ createType === 'vote' ? '投票选项' : '抽签选项' }}
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

    <!-- 编辑投票弹窗 -->
    <div v-if="showEditVoteDialog" class="dialog-overlay" @click.self="showEditVoteDialog = false">
      <div class="create-dialog glass">
        <div class="dialog-header">
          <h2>✏️ 编辑投票</h2>
          <button class="close-btn" @click="showEditVoteDialog = false">
            <Close class="close-icon" />
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="form-field">
            <label class="field-label">投票标题</label>
            <input v-model="editingVote.title" class="glass-input" placeholder="输入标题" />
          </div>

          <div class="form-field">
            <label class="field-label">描述</label>
            <textarea v-model="editingVote.description" class="glass-input glass-textarea" rows="2"></textarea>
          </div>

          <div class="form-field">
            <label class="field-label">选项（每行一个）</label>
            <textarea v-model="editingVote.optionsText" class="glass-input glass-textarea" rows="4"></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="glass-btn secondary" @click="showEditVoteDialog = false">取消</button>
          <button class="glass-btn primary" @click="saveEditVote">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑抽签弹窗 -->
    <div v-if="showEditTaskDialog" class="dialog-overlay" @click.self="showEditTaskDialog = false">
      <div class="create-dialog glass">
        <div class="dialog-header">
          <h2>✏️ 编辑抽签</h2>
          <button class="close-btn" @click="showEditTaskDialog = false">
            <Close class="close-icon" />
          </button>
        </div>
        
        <div class="dialog-body">
          <div class="form-field">
            <label class="field-label">抽签标题</label>
            <input v-model="editingTask.title" class="glass-input" placeholder="输入标题" />
          </div>

          <div class="form-field">
            <label class="field-label">描述</label>
            <textarea v-model="editingTask.description" class="glass-input glass-textarea" rows="2"></textarea>
          </div>

          <div class="form-field">
            <label class="field-label">选项（每行一个）</label>
            <textarea v-model="editingTask.optionsText" class="glass-input glass-textarea" rows="4"></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="glass-btn secondary" @click="showEditTaskDialog = false">取消</button>
          <button class="glass-btn primary" @click="saveEditTask">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, Plus, DataLine, List, User, Check, Document, Close, Edit, Delete } from '@element-plus/icons-vue'

const router = useRouter()

const currentType = ref('vote')
const showCreateDialog = ref(false)
const createType = ref('vote')

const votes = ref([])
const lotterys = ref([])

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

// 编辑弹窗相关
const showEditVoteDialog = ref(false)
const showEditTaskDialog = ref(false)
const editingVote = ref(null)
const editingTask = ref(null)

// 投票操作处理
const handleVoteAction = async (action, vote) => {
  if (action === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个投票吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/votes/${vote.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      
      if (data.success) {
        ElMessage.success('删除成功')
        fetchData()
      } else {
        ElMessage.error(data.error || '删除失败')
      }
    } catch (e) {
      if (e !== 'cancel') {
        console.error('删除失败:', e)
      }
    }
  } else if (action === 'edit') {
    // 检查是否可以编辑
    if (vote.status === 1) {
      ElMessage.warning('已结束的投票不能编辑')
      return
    }
    if (vote.vote_count > 0) {
      ElMessage.warning('已有投票记录，不能编辑')
      return
    }
    openEditVoteDialog(vote)
  }
}

// 抽签操作处理
const handleTaskAction = async (action, lottery) => {
  if (action === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个抽签吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/votes/lotterys/${lottery.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      
      if (data.success) {
        ElMessage.success('删除成功')
        fetchData()
      } else {
        ElMessage.error(data.error || '删除失败')
      }
    } catch (e) {
      if (e !== 'cancel') {
        console.error('删除失败:', e)
      }
    }
  } else if (action === 'edit') {
    // 检查是否可以编辑
    if (lottery.status === 1) {
      ElMessage.warning('已完成的抽签不能编辑')
      return
    }
    openEditTaskDialog(lottery)
  }
}

// 打开编辑投票弹窗
const openEditVoteDialog = (vote) => {
  editingVote.value = { ...vote, optionsText: vote.options?.map(o => o.content).join('\n') || '' }
  showEditVoteDialog.value = true
}

// 打开编辑抽签弹窗
const openEditTaskDialog = (lottery) => {
  editingTask.value = { ...lottery, optionsText: lottery.options?.map(o => o.content).join('\n') || '' }
  showEditTaskDialog.value = true
}

// 保存编辑投票
const saveEditVote = async () => {
  if (!editingVote.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  
  const options = editingVote.value.optionsText
    .split('\n')
    .map(o => o.trim())
    .filter(o => o)
  
  if (options.length < 2) {
    ElMessage.warning('至少2个选项')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/votes/${editingVote.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: editingVote.value.title,
        description: editingVote.value.description,
        options
      })
    })
    
    const data = await res.json()
    if (data.success) {
      ElMessage.success('修改成功')
      showEditVoteDialog.value = false
      fetchData()
    } else {
      ElMessage.error(data.error || '修改失败')
    }
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

// 保存编辑抽签
const saveEditTask = async () => {
  if (!editingTask.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  
  const options = editingTask.value.optionsText
    .split('\n')
    .map(o => o.trim())
    .filter(o => o)
  
  if (options.length < 1) {
    ElMessage.warning('至少1个选项')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/votes/lotterys/${editingTask.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: editingTask.value.title,
        description: editingTask.value.description,
        options
      })
    })
    
    const data = await res.json()
    if (data.success) {
      ElMessage.success('修改成功')
      showEditTaskDialog.value = false
      fetchData()
    } else {
      ElMessage.error(data.error || '修改失败')
    }
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

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
    
    // 再获取抽签
    const lotterysRes = await fetch('/api/lottery', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const lotterysData = await lotterysRes.json()
    if (lotterysData.success) {
      lotterys.value = lotterysData.data || []
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
  
  const endpoint = createType.value === 'vote' ? '/api/votes' : '/api/lottery'
  console.log('Endpoint:', endpoint)
  
  const body = {
    title: createForm.value.title,
    description: createForm.value.description,
    options
  }
  
  if (createType.value === 'vote') {
    body.type = createForm.value.voteType
    body.require_majority = createForm.value.requireMajority
  } else {
    // 抽签需要参与者
    body.participant_ids = createForm.value.members
    if (!body.participant_ids || body.participant_ids.length === 0) {
      ElMessage.warning('请选择参与抽签的成员')
      return
    }
    if (body.participant_ids.length !== options.length) {
      ElMessage.warning('参与人数必须与抽签项目数量相同')
      return
    }
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
      lotterys.value = []
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

const openTaskDetail = (lottery) => {
  router.push(`/votes/lottery/${lottery.id}`)
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

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kebab-menu {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.kebab-menu:hover {
  background: rgba(255, 255, 255, 0.1);
}

.kebab-menu span {
  display: block;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
}

.menu-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
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
