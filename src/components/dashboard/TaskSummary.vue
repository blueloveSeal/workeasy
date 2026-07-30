<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import AppCard from '@/components/common/AppCard.vue'

const taskStore = useTaskStore()
const router = useRouter()

onMounted(() => { taskStore.load() })

const today = dayjs().format('YYYY-MM-DD')

const todayTasks = computed(() =>
  taskStore.tasks.filter(t => t.dueDate === today && t.status !== 'done')
)

const overdueCount = computed(() =>
  taskStore.tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done').length
)

const priorityColor = (p: string) => {
  const map: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444', urgent: '#DC2626' }
  return map[p] || '#94A3B8'
}
</script>

<template>
  <AppCard title="Tasks" :subtitle="todayTasks.length + ' due today'">
    <template #actions>
      <el-button text size="small" @click="router.push('/tasks')">View All</el-button>
    </template>

    <div class="task-stats">
      <div class="stat">
        <span class="stat-value">{{ todayTasks.length }}</span>
        <span class="stat-label">Due Today</span>
      </div>
      <div class="stat">
        <span class="stat-value overdue">{{ overdueCount }}</span>
        <span class="stat-label">Overdue</span>
      </div>
    </div>

    <div v-if="todayTasks.length" class="task-list">
      <div v-for="task in todayTasks.slice(0, 3)" :key="task.id" class="task-item">
        <span class="priority-dot" :style="{ background: priorityColor(task.priority) }" />
        <span class="task-title">{{ task.title }}</span>
      </div>
    </div>
    <div v-else class="empty-hint">No tasks due today</div>
  </AppCard>
</template>

<style scoped>
.task-stats { display: flex; gap: 24px; margin-bottom: 16px; }
.stat { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.stat-value.overdue { color: var(--color-danger); }
.stat-label { font-size: 12px; color: var(--text-muted); }
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.task-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
