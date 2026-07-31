<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import AppCard from '@/components/common/AppCard.vue'

const taskStore = useTaskStore()
const router = useRouter()

onMounted(() => { taskStore.load() })

const today = dayjs().format('YYYY-MM-DD')
const newTaskTitle = ref('')
const adding = ref(false)

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

const priorityLabel = (p: string) => {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '急' }
  return map[p] || p
}

async function toggleTask(task: { id: string; status: string }) {
  const newStatus = task.status === 'done' ? 'todo' : 'done'
  await taskStore.update(task.id, { status: newStatus } as any)
}

async function addQuickTask() {
  const title = newTaskTitle.value.trim()
  if (!title || adding.value) return
  adding.value = true
  try {
    await taskStore.add({
      title,
      status: 'todo',
      priority: 'medium',
      dueDate: today,
      tags: [],
    })
    newTaskTitle.value = ''
  } finally {
    adding.value = false
  }
}

async function deleteTask(id: string) {
  await taskStore.remove(id)
}
</script>

<template>
  <AppCard title="任务" :subtitle="todayTasks.length + ' 项今日到期'">
    <template #actions>
      <el-button text size="small" @click="router.push('/tasks')">查看全部</el-button>
    </template>

    <div class="task-stats">
      <div class="stat">
        <span class="stat-value">{{ todayTasks.length }}</span>
        <span class="stat-label">今日到期</span>
      </div>
      <div class="stat">
        <span class="stat-value overdue">{{ overdueCount }}</span>
        <span class="stat-label">已逾期</span>
      </div>
    </div>

    <div v-if="todayTasks.length" class="task-list">
      <div v-for="task in todayTasks" :key="task.id" class="task-item">
        <el-checkbox
          :model-value="task.status === 'done'"
          size="small"
          @change="toggleTask(task)"
        />
        <span class="priority-dot" :style="{ background: priorityColor(task.priority) }" :title="'优先级: ' + priorityLabel(task.priority)" />
        <span class="task-title" :class="{ done: task.status === 'done' }">{{ task.title }}</span>
        <el-button
          class="task-action-btn"
          size="small"
          text
          type="danger"
          @click.stop="deleteTask(task.id)"
        >
          <el-icon :size="14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></el-icon>
        </el-button>
      </div>
    </div>
    <div v-else class="empty-hint">今日无到期任务</div>

    <div class="quick-add">
      <el-input
        v-model="newTaskTitle"
        placeholder="快速添加任务..."
        size="small"
        @keyup.enter="addQuickTask"
        :disabled="adding"
      >
        <template #append>
          <el-button :disabled="!newTaskTitle.trim() || adding" @click="addQuickTask">
            <el-icon :size="14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </AppCard>
</template>

<style scoped>
.task-stats { display: flex; gap: 24px; margin-bottom: 12px; }
.stat { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.stat-value.overdue { color: var(--color-danger); }
.stat-label { font-size: 12px; color: var(--text-muted); }
.task-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.task-item { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 4px 6px; border-radius: 6px; transition: background 0.15s ease; }
.task-item:hover { background: var(--bg-input); }
.priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; cursor: default; }
.task-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.task-title.done { text-decoration: line-through; color: var(--text-muted); }
.task-action-btn { opacity: 0; transition: opacity 0.15s ease; flex-shrink: 0; padding: 2px !important; }
.task-item:hover .task-action-btn { opacity: 1; }
.quick-add { margin-top: 8px; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
