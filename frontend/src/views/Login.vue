<template>
  <div class="login-page">
    <div class="login-container animate-fade-in">
      <div class="login-header">
        <div class="logo animate-float">
          <Lightning class="logo-icon" />
        </div>
        <h1 class="title">南宁师范大学<span class="highlight">宿舍三两事</span></h1>
        <p class="subtitle">宿舍事务 | 投票抽签 | 电费监控一站式平台</p>
      </div>
      
      <el-form 
        :model="form" 
        :rules="rules"
        ref="formRef"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="account">
          <el-input
            v-model="form.account"
            placeholder="学校账号（手机号）"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 身份选择 -->
        <div class="role-select">
          <div class="role-label">选择身份：</div>
          <div class="role-buttons">
            <div 
              class="role-glass-btn" 
              :class="{ active: form.role === 'leader' }"
              @click="form.role = 'leader'"
            >
              <span class="role-icon">👑</span>
              <span>宿舍长</span>
            </div>
            <div 
              class="role-glass-btn" 
              :class="{ active: form.role === 'member' }"
              @click="form.role = 'member'"
            >
              <span class="role-icon">👤</span>
              <span>宿舍成员</span>
            </div>
          </div>
        </div>
        
        <!-- 记住密码 -->
        <div class="remember-row">
          <el-checkbox v-model="form.remember" size="large">记住密码</el-checkbox>
        </div>
        
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '立即登录' }}
        </el-button>
      </el-form>
      
      <div class="login-footer">
        <p class="tip">使用学校电费网站账号直接登录</p>
        <div class="login-links">
          <a href="http://wsxf.nnnu.edu.cn/" target="_blank" class="link">忘记密码?</a>
          <span class="divider">|</span>
          <a href="http://wsxf.nnnu.edu.cn/" target="_blank" class="link">新用户注册</a>
        </div>
        <p class="security"><Lock class="lock-icon" /> 密码加密存储，仅用于数据采集</p>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Lightning } from '@element-plus/icons-vue'
import { authApi } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  account: localStorage.getItem('saved_account') || '',
  password: localStorage.getItem('saved_password') || '',
  role: 'member',  // 默认为宿舍成员
  remember: localStorage.getItem('remember_me') === 'true'
})

const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const res = await authApi.login(form.account, form.password, form.role)
      
      if (res.data.success) {
        userStore.setToken(res.data.token)
        userStore.setUser(res.data.user)
        
        // 处理记住密码
        if (form.remember) {
          localStorage.setItem('saved_account', form.account)
          localStorage.setItem('saved_password', form.password)
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('saved_account')
          localStorage.removeItem('saved_password')
          localStorage.setItem('remember_me', 'false')
        }
        
        ElMessage.success('登录成功！')
        router.push('/')
      }
    } catch (error) {
      const msg = error.response?.data?.error || '登录失败，请检查账号密码'
      ElMessage.error(msg)
    } finally {
      loading.value = false
    }
  })
}

// 已登录则跳转首页
onMounted(() => {
  if (userStore.token) {
    router.push('/electricity')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: white;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #1a202c;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.title .highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #718096;
  font-size: 14px;
}

.login-form {
  margin-bottom: 32px;
}

.role-select {
  margin-bottom: 24px;
}

.role-label {
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 12px;
  font-weight: 500;
}

.role-buttons {
  display: flex;
  gap: 12px;
}

.role-glass-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  color: #4a5568;
  font-weight: 500;
}

.role-glass-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
}

.role-glass-btn.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-color: #667eea;
  color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.remember-row {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.remember-row :deep(.el-checkbox__label) {
  color: #4a5568;
}

.role-icon {
  font-size: 18px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.login-footer {
  text-align: center;
}

.login-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.login-links .link {
  color: #667eea;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.3s;
}

.login-links .link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.login-links .divider {
  color: #cbd5e0;
  font-size: 12px;
}

.tip {
  color: #a0aec0;
  font-size: 13px;
  margin-bottom: 8px;
}

.security {
  color: #48bb78;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.lock-icon {
  width: 14px;
  height: 14px;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
}

.c1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.c2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  animation: float 8s ease-in-out infinite reverse;
}

.c3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 10%;
  animation: float 7s ease-in-out infinite 1s;
}

@media (max-width: 480px) {
  .login-container {
    padding: 32px 24px;
  }
  
  .title {
    font-size: 26px;
  }
}
</style>
