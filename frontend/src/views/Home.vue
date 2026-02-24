<template>
  <div class="home">
    <!-- 重定向到dashboard -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  } else {
    router.push('/login')
  }
})
</script>
