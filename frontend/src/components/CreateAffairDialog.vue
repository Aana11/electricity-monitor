<template>
  <el-dialog
    v-model="visible"
    :title="isRecurring ? '创建周期事务' : '创建新事务'"
    width="90%"
    max-width="480px"
    :close-on-click-modal="false"
    class="glass-dialog"
  >
    <!-- 事务类型切换 -->
    <div class="type-switch">
      <div 
        class="type-btn" 
        :class="{ active: !isRecurring }"
        @click="isRecurring = false"
      >
        <span>📝</span>
        <span>一次性</span>
      </div>
      <div 
        class="type-btn" 
        :class="{ active: isRecurring }"
        @click="isRecurring = true"
      >
        <span>🔄</span>
        <span>周期性</span>
      </div>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
      <!-- 标题 -->
      <div class="form-field">
        <label class="field-label">事务标题</label>
        <input 
          v-model="form.title" 
          class="glass-input"
          :placeholder="isRecurring ? '例如：每月交电费、每周大扫除...' : '例如：交电费、打扫卫生...'"
          maxlength="50"
        />
        <span class="char-count">{{ form.title.length }}/50</span>
      </div>

      <!-- 描述 -->
      <div class="form-field">
        <label class="field-label">事务描述</label>
        <textarea 
          v-model="form.description" 
          class="glass-input glass-textarea"
          placeholder="详细描述事务内容（可选）"
          maxlength="200"
          rows="3"
        ></textarea>
        <span class="char-count">{{ form.description.length }}/200</span>
      </div>

      <!-- 优先级 -->
      <div class="form-field">
        <label class="field-label">优先级</label>
        <div class="priority-options">
          <div 
            class="priority-btn" 
            :class="{ active: form.priority === 1 }"
            @click="form.priority = 1"
          >
            <span class="priority-icon">⚪</span>
            <span>日常</span>
          </div>
          <div 
            class="priority-btn urgent" 
            :class="{ active: form.priority === 2 }"
            @click="form.priority = 2"
          >
            <span class="priority-icon">🔴</span>
            <span>紧急</span>
          </div>
        </div>
      </div>

      <!-- 周期设置 -->
      <template v-if="isRecurring">
        <div class="form-field">
          <label class="field-label">重复周期</label>
          <select v-model="form.recurrenceType" class="glass-select">
            <option value="">选择周期类型</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </div>

        <div v-if="form.recurrenceType === 'weekly'" class="form-field">
          <label class="field-label">每周几</label>
          <select v-model="form.recurrenceValue" class="glass-select">
            <option value="">选择星期几</option>
            <option value="1">周一</option>
            <option value="2">周二</option>
            <option value="3">周三</option>
            <option value="4">周四</option>
            <option value="5">周五</option>
            <option value="6">周六</option>
            <option value="0">周日</option>
          </select>
        </div>

        <div v-if="form.recurrenceType === 'monthly'" class="form-field">
          <label class="field-label">每月几号</label>
          <input 
            v-model.number="form.recurrenceValue" 
            type="number" 
            min="1" 
            max="28"
            class="glass-input"
            placeholder="1-28"
          />
        </div>

        <div class="form-field">
          <label class="field-label">截止时间</label>
          <input 
            v-model="form.deadline" 
            type="date" 
            class="glass-input"
          />
        </div>
      </template>

      <!-- 截止时间（非周期） -->
      <div v-if="!isRecurring" class="form-field">
        <label class="field-label">截止时间</label>
        <input 
          v-model="form.deadline" 
          type="date" 
          class="glass-input"
        />
      </div>

      <!-- 提醒 -->
      <div class="form-field">
        <label class="field-label">提醒</label>
        <div class="remind-toggle">
          <span>开启提醒</span>
          <button 
            type="button"
            class="toggle-btn" 
            :class="{ active: form.remindEnabled }"
            @click="form.remindEnabled = !form.remindEnabled"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <!-- 提醒人 -->
      <div class="form-field">
        <label class="field-label">提醒成员</label>
        <div v-if="roomMembers.length > 0" class="member-options">
          <div 
            v-for="member in roomMembers" 
            :key="member.id"
            class="member-btn"
            :class="{ active: selectedMembers.includes(member.id) }"
            @click="toggleMember(member.id)"
          >
            <span class="member-avatar">{{ member.real_name?.charAt(0) || '?' }}</span>
            <span class="member-name">{{ member.real_name || '未知' }}</span>
          </div>
        </div>
        <div v-else class="no-members">暂无室友信息</div>
      </div>
    </el-form>

    <!-- 底部按钮 -->
    <template #footer>
      <button class="glass-btn secondary" @click="visible = false">取消</button>
      <button class="glass-btn primary" @click="handleSubmit">创建</button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isRecurring = ref(false)
const formRef = ref(null)

// 成员列表
const roomMembers = ref([])
const selectedMembers = ref([])

      // 获取成员列表
const fetchMembers = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('未登录，无法获取成员列表')
      return
    }
    const response = await fetch('/api/affairs/members/room', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const result = await response.json()
    console.log('成员 API 响应:', result)
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

onMounted(() => {
  fetchMembers()
})

const form = ref({
  title: '',
  description: '',
  priority: 1,
  recurrenceType: '',
  recurrenceValue: '',
  deadline: '',
  remindEnabled: true
})

const rules = {
  title: [{ required: true, message: '请输入事务标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

// 监听类型切换，重置表单
watch(isRecurring, (val) => {
  if (val) {
    form.value.recurrenceType = 'weekly'
    form.value.recurrenceValue = ''
  }
})

// 切换成员
const toggleMember = (userId) => {
  const index = selectedMembers.value.indexOf(userId)
  if (index === -1) {
    selectedMembers.value.push(userId)
  } else {
    selectedMembers.value.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入事务标题')
    return
  }
  
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }
  
  try {
    const data = {
      title: form.value.title,
      description: form.value.description,
      priority: form.value.priority,
      deadline: form.value.deadline || null,
      isRecurring: isRecurring.value,
      recurrenceType: isRecurring.value ? form.value.recurrenceType : null,
      recurrenceValue: isRecurring.value ? form.value.recurrenceValue : null,
      remindAt: form.value.remindEnabled ? form.value.deadline : null,
      members: selectedMembers.value
    }
    
    const token = localStorage.getItem('token')
    console.log('提交数据:', data)
    console.log('Token:', token ? '存在' : '不存在')
    
    const response = await fetch('/api/affairs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    console.log('创建响应:', result)
    
    if (result.success) {
      ElMessage.success('创建成功')
      visible.value = false
      emit('success')
      // 重置表单
      form.value = {
        title: '',
        description: '',
        priority: 1,
        recurrenceType: '',
        recurrenceValue: '',
        deadline: '',
        remindEnabled: true
      }
      selectedMembers.value = []
      isRecurring.value = false
    } else {
      const err = await response.json()
      ElMessage.error(err.message || '创建失败')
    }
  } catch (error) {
    console.error('创建事务失败:', error)
    ElMessage.error('创建失败，请重试')
  }
}
</script>

<style scoped>
/* 弹窗容器 */
:deep(.el-dialog) {
  border-radius: 16px !important;
  background: rgba(30, 32, 60, 0.95) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5) !important;
}

:deep(.el-dialog__header) {
  background: rgba(40, 42, 70, 0.95) !important;
  padding: 18px 24px !important;
  margin: 0 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-dialog__title) {
  color: #fff !important;
  font-size: 17px !important;
  font-weight: 600 !important;
}

:deep(.el-dialog__headerbtn) {
  top: 18px !important;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #fff !important;
}

:deep(.el-dialog__body) {
  padding: 24px !important;
  color: #fff !important;
}

:deep(.el-dialog__footer) {
  background: rgba(40, 42, 70, 0.95) !important;
  padding: 16px 24px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* 类型切换 */
.type-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  border: 1px solid transparent;
}

.type-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.type-btn.active {
  background: rgba(102, 126, 234, 0.25);
  color: #fff;
  border: 1px solid rgba(102, 126, 234, 0.4);
}

/* 表单字段 */
.form-field {
  margin-bottom: 20px;
  position: relative;
}

.field-label {
  display: block;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
}

/* 输入框 */
.glass-input,
.glass-textarea,
.glass-select {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  outline: none;
}

.glass-input::placeholder,
.glass-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.glass-input:hover,
.glass-textarea:hover,
.glass-select:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.glass-input:focus,
.glass-textarea:focus,
.glass-select:focus {
  border-color: rgba(102, 126, 234, 0.7);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.glass-textarea {
  resize: vertical;
  min-height: 80px;
}

/* 选择框 */
.glass-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.6)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}

.glass-select option {
  background: #282846;
  color: #fff;
}

/* 字数统计 */
.char-count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

/* 优先级选项 */
.priority-options {
  display: flex;
  gap: 10px;
}

.priority-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.priority-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.priority-btn.active {
  background: rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.5);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.priority-btn.urgent:hover {
  background: rgba(255, 107, 107, 0.15);
  border-color: rgba(255, 107, 107, 0.4);
}

.priority-btn.urgent.active {
  background: rgba(255, 107, 107, 0.25);
  border-color: rgba(255, 107, 107, 0.5);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.priority-icon {
  font-size: 14px;
}

/* 提醒开关 */
.remind-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.toggle-btn {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  padding: 0;
}

.toggle-btn.active {
  background: rgba(102, 126, 234, 0.6);
  border-color: rgba(102, 126, 234, 0.7);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-btn.active .toggle-knob {
  left: 24px;
}

/* 按钮 */
.glass-btn {
  padding: 12px 24px;
  border-radius: 10px;
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
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.glass-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.glass-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 遮罩 */
:deep(.el-overlay) {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
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
