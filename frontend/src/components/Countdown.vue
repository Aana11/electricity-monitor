<template>
  <span class="countdown" :class="timeClass">
    {{ displayText }}
  </span>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  deadline: {
    type: String,
    required: true
  }
})

const now = ref(new Date())
let timer = null

const diff = computed(() => {
  const deadline = new Date(props.deadline)
  return deadline - now.value
})

const timeClass = computed(() => {
  if (diff.value < 0) return 'expired'
  if (diff.value < 24 * 60 * 60 * 1000) return 'urgent'
  if (diff.value < 3 * 24 * 60 * 60 * 1000) return 'warning'
  return 'normal'
})

const displayText = computed(() => {
  if (diff.value < 0) {
    const hours = Math.floor(Math.abs(diff.value) / (60 * 60 * 1000))
    if (hours < 24) return `过期${hours}小时`
    const days = Math.floor(hours / 24)
    return `过期${days}天`
  }
  
  const days = Math.floor(diff.value / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff.value % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff.value % (60 * 60 * 1000)) / (60 * 1000))
  
  if (days > 0) return `剩${days}天`
  if (hours > 0) return `剩${hours}小时`
  if (minutes > 0) return `剩${minutes}分钟`
  return '即将到期'
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000) // 每分钟更新一次
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.countdown {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.countdown.normal {
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
}

.countdown.warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
}

.countdown.urgent {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  animation: pulse 1.5s ease-in-out infinite;
}

.countdown.expired {
  color: #6b7280;
  background: rgba(107, 114, 128, 0.2);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
