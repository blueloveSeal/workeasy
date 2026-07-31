<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useGreeting } from '@/composables/useGreeting'
import { useSearchStore } from '@/stores/search'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'
import { Search, Setting } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const searchStore = useSearchStore()
const router = useRouter()
const { greeting } = useGreeting()

dayjs.locale('zh-cn')

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
  <header class="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <div class="time-display">{{ timeStr }}</div>
        <div class="date-greeting">
          <span class="date-text">{{ dateStr }}</span>
          <span class="greeting-text">{{ greeting }}</span>
        </div>
      </div>

      <div class="topbar-center">
        <button type="button" class="search-trigger" @click="searchStore.open()">
          <el-icon :size="16"><Search /></el-icon>
          <span>搜索工作台</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>

      <div class="topbar-right">
        <ThemeSwitcher />
        <el-button circle :icon="Setting" aria-label="打开设置" @click="router.push('/settings')" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  background: var(--topbar-bg);
  backdrop-filter: blur(18px) saturate(1.05);
  -webkit-backdrop-filter: blur(18px) saturate(1.05);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-inner {
  width: min(100% - 48px, 1320px);
  height: 78px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(280px, 420px) minmax(220px, 1fr);
  align-items: center;
  gap: 24px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.time-display {
  font-size: clamp(24px, 2vw, 30px);
  line-height: 1;
  font-weight: 750;
  letter-spacing: -0.055em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.date-greeting {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.greeting-text {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 650;
  letter-spacing: 0.04em;
}

.topbar-center {
  display: flex;
  justify-content: center;
}

.search-trigger {
  appearance: none;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 14px;
  border-radius: 13px;
  background: var(--bg-input);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 220ms ease, border-color 220ms ease, transform 220ms ease;
  width: 100%;
  font-size: 13px;
  font-family: inherit;
}

.search-trigger:hover {
  background: var(--bg-card);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.search-trigger:active {
  transform: scale(0.99);
}

.search-trigger kbd {
  margin-left: auto;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-secondary);
  box-shadow: 0 1px 0 var(--border-color);
}

.topbar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 880px) {
  .topbar-inner {
    width: calc(100% - 32px);
    grid-template-columns: auto 1fr auto;
  }

  .date-greeting {
    display: none;
  }
}

@media (max-width: 560px) {
  .topbar-inner {
    width: calc(100% - 24px);
    height: 68px;
    gap: 10px;
  }

  .time-display {
    font-size: 21px;
  }

  .search-trigger span,
  .search-trigger kbd {
    display: none;
  }

  .search-trigger {
    width: 42px;
    justify-content: center;
    padding: 10px;
    margin-left: auto;
  }
}
</style>
