<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { useGreeting } from '@/composables/useGreeting'
import { useSearchStore } from '@/stores/search'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'
import { Search, Setting } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const searchStore = useSearchStore()
const router = useRouter()
const { greeting } = useGreeting()

const now = ref(dayjs())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => { now.value = dayjs() }, 1000)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchStore.open()
  }
}

const timeStr = computed(() => now.value.format('HH:mm:ss'))
const dateStr = computed(() => now.value.format('YYYY-MM-DD dddd'))
</script>

<template>
  <div class="topbar">
    <div class="topbar-left">
      <div class="time-display">{{ timeStr }}</div>
      <div class="date-greeting">
        <span class="date-text">{{ dateStr }}</span>
        <span class="greeting-text">{{ greeting }}</span>
      </div>
    </div>

    <div class="topbar-center">
      <div class="search-trigger" @click="searchStore.open()">
        <el-icon :size="16"><Search /></el-icon>
        <span>Search...</span>
        <kbd>Ctrl+K</kbd>
      </div>
    </div>

    <div class="topbar-right">
      <ThemeSwitcher />
      <el-button circle :icon="Setting" @click="router.push('/settings')" />
    </div>
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-display {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.date-greeting {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.greeting-text {
  font-size: 12px;
  color: var(--text-muted);
}

.topbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 400px;
  margin: 0 24px;
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  font-size: 13px;
}

.search-trigger:hover {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.search-trigger kbd {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
