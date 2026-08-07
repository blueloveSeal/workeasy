<template>
  <div class="task-page">
    <TopBar />

    <div class="task-content">
      <!-- Header: Title + View Toggle -->
      <div class="task-header">
        <h2 class="page-title">任务管理</h2>
        <div class="header-actions">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              列表
            </el-radio-button>
            <el-radio-button value="kanban">
              <el-icon><Grid /></el-icon>
              看板
            </el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="openDrawer()">
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
        </div>
      </div>

      <!-- Batch Operations Bar -->
      <div v-if="selectedTasks.length > 0" class="batch-bar">
        <span class="batch-info">已选择 {{ selectedTasks.length }} 项任务</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-dropdown @command="handleBatchStatusChange">
          <el-button size="small">
            批量更改状态
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="todo">待办</el-dropdown-item>
              <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
              <el-dropdown-item command="done">已完成</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="selectedTasks = []">取消选择</el-button>
      </div>

      <!-- ==================== LIST VIEW ==================== -->
      <template v-if="viewMode === 'list'">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <el-select
            v-model="filterStatus"
            placeholder="按状态筛选"
            clearable
            style="width: 180px"
          >
            <el-option label="待办" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="done" />
          </el-select>

          <el-select
            v-model="filterPriority"
            placeholder="按优先级筛选"
            clearable
            style="width: 180px"
          >
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>

          <el-input
            v-model="searchQuery"
            placeholder="搜索任务..."
            clearable
            style="width: 260px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- Task Table -->
        <el-table
          :data="filteredTasks as any[]"
          :row-class-name="tableRowClassName"
          @selection-change="handleSelectionChange"
          stripe
          style="width: 100%"
        >
          <el-table-column type="selection" width="50" />

          <el-table-column label="标题" min-width="240">
            <template #default="{ row }">
              <span
                class="task-title-cell"
                :class="{ 'task-title--done': (row as Task).status === 'done' }"
                @click="openDrawer(row as Task)"
              >
                {{ (row as Task).title }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="优先级" width="120" align="center">
            <template #default="{ row }">
              <el-tag
                :color="priorityColor((row as Task).priority)"
                effect="dark"
                size="small"
                round
              >
                {{ priorityLabel((row as Task).priority) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="截止日期" width="160" align="center">
            <template #default="{ row }">
              <span :class="{ 'overdue-text': isOverdue(row as Task) }">
                {{ (row as Task).dueDate ? dayjs((row as Task).dueDate).format('YYYY-MM-DD') : '--' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="160" align="center">
            <template #default="{ row }">
              <el-checkbox
                :model-value="(row as Task).status === 'done'"
                @change="(val) => toggleStatus(row as Task, !!val)"
              >
                <el-tag :type="statusTagType((row as Task).status)" size="small">
                  {{ statusLabel((row as Task).status) }}
                </el-tag>
              </el-checkbox>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDrawer(row as Task)">编辑</el-button>
              <el-popconfirm
                title="确定要删除这个任务吗？"
                @confirm="handleDelete((row as Task).id)"
              >
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <!-- Empty State -->
        <el-empty
          v-if="filteredTasks.length === 0"
          description="暂无任务，享受清闲吧"
        />
      </template>

      <!-- ==================== KANBAN VIEW ==================== -->
      <template v-if="viewMode === 'kanban'">
        <div class="kanban-board">
          <div
            v-for="column in kanbanColumns"
            :key="column.key"
            class="kanban-column"
          >
            <div class="kanban-column-header" :style="{ borderTopColor: column.color }">
              <span class="kanban-column-title">{{ column.label }}</span>
              <el-tag size="small" round>{{ getColumnTasks(column.key).length }}</el-tag>
            </div>

            <div
              class="kanban-column-body"
              @dragover.prevent
              @drop="handleDrop($event, column.key)"
            >
              <div
                v-for="element in getColumnTasks(column.key)"
                :key="element.id"
                class="kanban-card"
                draggable="true"
                :class="{ 'kanban-card--overdue': isOverdue(element) }"
                @click="openDrawer(element)"
                @dragstart="($event.dataTransfer)?.setData('taskId', String(element.id))"
              >
                <div class="kanban-card-title">{{ element.title }}</div>
                <div class="kanban-card-meta">
                  <el-tag
                    :color="priorityColor(element.priority)"
                    effect="dark"
                    size="small"
                    round
                  >
                    {{ element.priority }}
                  </el-tag>
                  <span class="kanban-card-date" :class="{ 'overdue-text': isOverdue(element) }">
                    {{ element.dueDate ? dayjs(element.dueDate).format('MM/DD') : '' }}
                  </span>
                </div>
                <div v-if="element.tags && element.tags.length" class="kanban-card-tags">
                  <el-tag
                    v-for="tag in element.tags"
                    :key="tag"
                    size="small"
                    type="info"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              
                <div v-if="getColumnTasks(column.key).length === 0" class="kanban-empty">
                  <el-empty :description="emptyKanbanText" :image-size="60" />
                </div>
              
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ==================== TASK DRAWER ==================== -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditing ? '编辑任务' : '新建任务'"
      direction="rtl"
      size="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="taskForm"
        :rules="formRules"
        label-position="top"
        class="task-form"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="taskForm.status" placeholder="选择状态" style="width: 100%">
                <el-option label="待办" value="todo" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="done" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="taskForm.priority" placeholder="选择优先级" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="date"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="标签">
          <div class="tags-input">
            <el-tag
              v-for="tag in taskForm.tags"
              :key="tag"
              closable
              :disable-transitions="false"
              @close="removeTag(tag)"
              style="margin-right: 6px; margin-bottom: 6px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              style="width: 120px"
              @keyup.enter="addTag"
              @blur="addTag"
            />
            <el-button
              v-else
              size="small"
              @click="showTagInput"
            >
              + 添加标签
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTask">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-drawer>

    <!-- Search Dialog -->
    <SearchDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search, List, Grid, ArrowDown } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import { useTaskStore } from '@/stores/task'
import type { Task } from '@/types/task'

// --- Store ---
const taskStore = useTaskStore()

onMounted(() => {
  taskStore.load()
})

// --- View mode ---
const viewMode = ref<'list' | 'kanban'>('list')

// --- Filters ---
const filterStatus = ref<string>('')
const filterPriority = ref<string>('')
const searchQuery = ref('')

// --- Selection ---
const selectedTasks = ref<Task[]>([])

// --- Drawer ---
const drawerVisible = ref(false)
const isEditing = ref(false)
const editingTaskId = ref<string | null>(null)
const formRef = ref<FormInstance>()

interface TaskFormData {
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  tags: string[]
}

const defaultForm = (): TaskFormData => ({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tags: [],
})

const taskForm = reactive<TaskFormData>(defaultForm())

const formRules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

// --- Tags input ---
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<any>(null)

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const val = tagInputValue.value.trim()
  if (val && !taskForm.tags.includes(val)) {
    taskForm.tags.push(val)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  taskForm.tags = taskForm.tags.filter((t) => t !== tag)
}

// --- Priority helpers ---
const PRIORITY_COLORS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626',
}

const priorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority] || '#909399'
}

const priorityLabel = (priority: string): string => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority] || priority
}

// --- Status helpers ---
const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成',
  }
  return map[status] || status
}

const statusTagType = (status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    todo: 'info',
    in_progress: 'warning',
    done: 'success',
  }
  return map[status] || undefined
}

// --- Overdue ---
const isOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === 'done') return false
  return dayjs(task.dueDate).isBefore(dayjs(), 'day')
}

const tableRowClassName = ({ row }: { row: Task }): string => {
  return isOverdue(row) ? 'overdue-row' : ''
}

// --- Filtered tasks ---
const filteredTasks = computed<Task[]>(() => {
  let tasks = taskStore.tasks as Task[]

  if (filterStatus.value) {
    tasks = tasks.filter((t) => t.status === filterStatus.value)
  }
  if (filterPriority.value) {
    tasks = tasks.filter((t) => t.priority === filterPriority.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    )
  }

  return tasks
})

// --- Kanban ---
const kanbanColumns = [
  { key: 'todo', label: '待办', color: '#909399' },
  { key: 'in_progress', label: '进行中', color: '#E6A23C' },
  { key: 'done', label: '已完成', color: '#67C23A' },
]

const getColumnTasks = (status: string): Task[] => {
  return filteredTasks.value.filter((t) => t.status === status)
}

const emptyKanbanText = '暂无任务'

const handleDrop = (event: DragEvent, newStatus: string) => {
  const taskId = event.dataTransfer?.getData('taskId')
  if (!taskId) return
  const task = taskStore.tasks.find(t => t.id === taskId)
  if (task && task.status !== newStatus) {
    taskStore.update(taskId, { status: newStatus as Task['status'] })
  }
}

// --- Drawer open/close ---
const openDrawer = (task?: Task) => {
  if (task) {
    isEditing.value = true
    editingTaskId.value = task.id
    Object.assign(taskForm, {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      tags: task.tags ? [...task.tags] : [],
    })
  } else {
    isEditing.value = false
    editingTaskId.value = null
    Object.assign(taskForm, defaultForm())
  }
  drawerVisible.value = true
}

// --- Save task ---
const handleSaveTask = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return

    const payload = { ...taskForm }

    if (isEditing.value && editingTaskId.value) {
      taskStore.update(editingTaskId.value, payload as any)
      ElMessage.success('任务已更新')
    } else {
      taskStore.add(payload as any)
      ElMessage.success('任务已创建')
    }

    drawerVisible.value = false
  })
}

// --- Delete ---
const handleDelete = (id: string) => {
  taskStore.remove(id)
  ElMessage.success('任务已删除')
}

// --- Quick status toggle ---
const toggleStatus = (task: Task, checked: boolean) => {
  const newStatus = checked ? 'done' : 'todo'
  taskStore.update(task.id, { status: newStatus })
}

// --- Selection ---
const handleSelectionChange = (rows: Task[]) => {
  selectedTasks.value = rows
}

// --- Batch operations ---
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTasks.value.length} 项任务吗？`,
      '批量删除',
      { type: 'warning' }
    )
    selectedTasks.value.forEach((t) => taskStore.remove(t.id))
    selectedTasks.value = []
    ElMessage.success('任务已删除')
  } catch {
    // user cancelled
  }
}

const handleBatchStatusChange = (status: string) => {
  selectedTasks.value.forEach((t) => {
    taskStore.update(t.id, { status: status as Task['status'] })
  })
  selectedTasks.value = []
  ElMessage.success('状态已更新')
}
</script>

<style scoped>
.task-page {
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.task-content {
  flex: 1;
  width: min(100% - 48px, 1320px);
  padding: 30px 32px 38px;
  background: color-mix(in srgb, var(--bg-card) 94%, transparent);
  margin: 24px auto 32px;
  border: 1px solid var(--border-color);
  border-radius: 24px 24px 24px 9px;
  box-shadow: var(--shadow-card);
  overflow: auto;
}

/* Header */
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1;
  font-weight: 750;
  letter-spacing: -0.055em;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Batch bar */
.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border-left: 3px solid var(--color-primary);
}

.batch-info {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: auto;
}

/* Filter bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* Table */
.task-title-cell {
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.2s;
}

.task-title-cell:hover {
  color: var(--color-primary);
}

.task-title--done {
  text-decoration: line-through;
  opacity: 0.6;
}

.overdue-text {
  color: var(--color-danger);
  font-weight: 600;
}

:deep(.overdue-row) {
  background-color: rgba(239, 68, 68, 0.06) !important;
}

:deep(.overdue-row:hover > td) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

/* Kanban */
.kanban-board {
  display: flex;
  gap: 16px;
  min-height: 500px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.kanban-column {
  flex: 1;
  min-width: 260px;
  background: var(--bg-secondary);
  border-radius: 16px 16px 16px 6px;
  border-top: 2px solid var(--text-muted);
  display: flex;
  flex-direction: column;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.kanban-column-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.kanban-column-body {
  flex: 1;
  padding: 8px 12px 12px;
  min-height: 120px;
}

.kanban-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 12px 12px 12px 5px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: grab;
  box-shadow: none;
  transition: box-shadow 0.2s, transform 0.15s;
}

.kanban-card:hover {
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card--overdue {
  border-left: 3px solid var(--color-danger);
}

.kanban-card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.kanban-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-card-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.kanban-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.kanban-empty {
  padding: 24px 0;
}

/* Drawer form */
.task-form {
  padding: 0 4px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

@media (max-width: 760px) {
  .task-content {
    width: calc(100% - 24px);
    margin: 16px auto 24px;
    padding: 22px 16px 28px;
    border-radius: 18px 18px 18px 7px;
  }

  .task-header {
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 34px;
    white-space: nowrap;
  }

  .header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .kanban-column {
    flex: 0 0 82vw;
  }
}
</style>
