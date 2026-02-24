import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'NavHome',
      component: () => import('../views/NavHome.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/electricity',
      name: 'ElectricityHome',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/electricity/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/electricity/rankings',
      name: 'Rankings',
      component: () => import('../views/Rankings.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/electricity/alerts',
      name: 'Alerts',
      component: () => import('../views/Alerts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/electricity/heatmap',
      name: 'Heatmap',
      component: () => import('../views/Heatmap.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/affairs',
      name: 'Affairs',
      component: () => import('../views/Affairs.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/affairs/:id',
      name: 'AffairDetail',
      component: () => import('../views/AffairDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/votes',
      name: 'Votes',
      component: () => import('../views/Votes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/votes/:id',
      name: 'VoteDetail',
      component: () => import('../views/VoteDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/votes/task/:id',
      name: 'TaskDetail',
      component: () => import('../views/TaskDetail.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/electricity/login')
  } else if (to.path === '/electricity/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
