import axios from 'axios'
import { useUserStore } from '../stores/user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
})

// 请求拦截器 - 添加token
api.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关
export const authApi = {
  login: (account, password) => api.post('/auth/login', { account, password })
}

// 电费数据相关
export const electricityApi = {
  getCurrent: () => api.get('/electricity/current'),
  getHistory: (days = 7) => api.get(`/electricity/history?days=${days}`),
  getDailyUsage: (days = 7) => api.get(`/electricity/daily-usage?days=${days}`),
  refresh: () => api.post('/electricity/refresh'),
  getAnalysis: () => api.get('/electricity/analysis')
}

// 排行榜相关
export const rankingApi = {
  getBalanceRank: () => api.get('/rankings/balance'),
  getUsageRank: () => api.get('/rankings/usage')
}

export default api
