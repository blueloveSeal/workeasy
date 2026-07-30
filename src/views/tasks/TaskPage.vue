<template>
  <div class="task-page">
    <TopBar />

    <div class="task-content">
      <!-- Header: Title + View Toggle -->
      <div class="task-header">
        <h2 class="page-title">Task Management</h2>
        <div class="header-actions">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              List
            </el-radio-button>
            <el-radio-button value="kanban">
              <el-icon><Grid /></el-icon>
              Kanban
            </el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="openDrawer()">
            <el-icon><Plus /></el-icon>
            New Task
          </el-button>
        </div>
      </div>

      <!-- Batch Operations Bar -->
      <div v-if="selectedTasks.length > 0" class="batch-bar">
        <span class="batch-info">{{ selectedTasks.length }} task(s) selected</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          Batch Delete
        </el-button>
        <el-dropdown @command="handleBatchStatusChange">
          <el-button size="small">
            Batch Change Status
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="todo">To Do</el-dropdown-item>
              <el-dropdown-item command="in_progress">In Progress</el-dropdown-item>
              <el-dropdown-item command="done">Done</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="selectedTasks = []">Clear Selection</el-button>
      </div>

      <!-- ==================== LIST VIEW ==================== -->
      <template v-if="viewMode === 'list'">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <el-select
            v-model="filterStatus"
            placeholder="Filter by status"
            clearable
            style="width: 180px"
          >
            <el-option label="To Do" value="todo" />
            <el-option label="In Progress" value="in_progress" />
            <el-option label="Done" value="done" />
          </el-select>

          <el-select
            v-model="filterPriority"
            placeholder="Filter by priority"
            clearable
            style="width: 180px"
          >
            <el-option label="Low" value="low" />
            <el-option label="Medium" value="medium" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>

          <el-input
            v-model="searchQuery"
            placeholder="Search tasks..."
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
          :data="filteredTasks"
          :row-class-name="tableRowClassName"
          @selection-change="handleSelectionChange"
          stripe
          style="width: 100%"
        >
          <el-table-column type="selection" width="50" />

          <el-table-column label="Title" min-width="240">
            <template #default="{ row }">
              <span
                class="task-title-cell"
                :class="{ 'task-title--done': row.status === 'done' }"
                @click="openDrawer(row)"
              >
                {{ row.title }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Priority" width="120" align="center">
            <template #default="{ row }">
              <el-tag
                :color="priorityColor(row.priority)"
                effect="dark"
                size="small"
                round
              >
                {{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Due Date" width="160" align="center">
            <template #default="{ row }">
              <span :class="{ 'overdue-text': isOverdue(row) }">
                {{ row.dueDate ? dayjs(row.dueDate).format('YYYY-MM-DD') : '--' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Status" width="160" align="center">
            <template #default="{ row }">
              <el-checkbox
                :model-value="row.status === 'done'"
                @change="(val: boolean) => toggleStatus(row, val)"
              >
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </el-checkbox>
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="160" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDrawer(row)">Edit</el-button>
              <el-popconfirm
                title="Are you sure to delete this task?"
                @confirm="handleDelete(row.id)"
              >
                <template #reference>
                  <el-button link type="danger">Delete</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <!-- Empty State -->
        <el-empty
          v-if="filteredTasks.length === 0"
          description="No tasks yet, enjoy the leisure"
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
      :title="isEditing ? 'Edit Task' : 'New Task'"
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
        <el-form-item label="Title" prop="title">
          <el-input v-model="taskForm.title" placeholder="Enter task title" />
        </el-form-item>

        <el-form-item label="Description" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="4"
            placeholder="Enter task description"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Status" prop="status">
              <el-select v-model="taskForm.status" placeholder="Select status" style="width: 100%">
                <el-option label="To Do" value="todo" />
                <el-option label="In Progress" value="in_progress" />
                <el-option label="Done" value="done" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Priority" prop="priority">
              <el-select v-model="taskForm.priority" placeholder="Select priority" style="width: 100%">
                <el-option label="Low" value="low" />
                <el-option label="Medium" value="medium" />
                <el-option label="High" value="high" />
                <el-option label="Urgent" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Due Date" prop="dueDate">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="date"
            placeholder="Select due date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Tags">
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
              + Add Tag
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSaveTask">
          {{ isEditing ? 'Update' : 'Create' }}
        </el-button>
      </template>
    </el-drawer>

    <!-- Search Dialog -->
    <SearchDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
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
  title: [{ required: true, message: 'Please enter a task title', trigger: 'blur' }],
  status: [{ required: true, message: 'Please select a status', trigger: 'change' }],
  priority: [{ required: true, message: 'Please select a priority', trigger: 'change' }],
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

// --- Status helpers ---
const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  }
  return map[status] || status
}

const statusTagType = (status: string): '' | 'success' | 'warning' | 'info' => {
  const map: Record<string, '' | 'success' | 'warning' | 'info'> = {
    todo: 'info',
    in_progress: 'warning',
    done: 'success',
  }
  return map[status] || ''
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
  { key: 'todo', label: 'To Do', color: '#909399' },
  { key: 'in_progress', label: 'In Progress', color: '#E6A23C' },
  { key: 'done', label: 'Done', color: '#67C23A' },
]

const getColumnTasks = (status: string): Task[] => {
  return filteredTasks.value.filter((t) => t.status === status)
}

const emptyKanbanText = 'No tasks'

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
      ElMessage.success('Task updated')
    } else {
      taskStore.add(payload as any)
      ElMessage.success('Task created')
    }

    drawerVisible.value = false
  })
}

// --- Delete ---
const handleDelete = (id: string) => {
  taskStore.remove(id)
  ElMessage.success('Task deleted')
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
      `Are you sure to delete ${selectedTasks.value.length} task(s)?`,
      'Batch Delete',
      { type: 'warning' }
    )
    selectedTasks.value.forEach((t) => taskStore.remove(t.id))
    selectedTasks.value = []
    ElMessage.success('Tasks deleted')
  } catch {
    // user cancelled
  }
}

const handleBatchStatusChange = (status: string) => {
  selectedTasks.value.forEach((t) => {
    taskStore.update(t.id, { status: status as Task['status'] })
  })
  selectedTasks.value = []
  ElMessage.success('Status updated')
}
</script>

<style scoped>
.task-page {
  min-height: 100vh;
  background: var(--bg-page, #f5f7fa);
  display: flex;
  flex-direction: column;
}

.task-content {
  flex: 1;
  padding: 24px 32px;
  background: var(--bg-card, #ffffff);
  margin: 16px 24px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Header */
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
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
  background: var(--bg-secondary, #f0f2f5);
  border-radius: 8px;
}

.batch-info {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
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
  color: var(--text-primary, #1f2937);
  transition: color 0.2s;
}

.task-title-cell:hover {
  color: var(--el-color-primary, #409eff);
}

.task-title--done {
  text-decoration: line-through;
  opacity: 0.6;
}

.overdue-text {
  color: #EF4444;
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
  gap: 20px;
  min-height: 500px;
}

.kanban-column {
  flex: 1;
  min-width: 260px;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 10px;
  border-top: 3px solid #909399;
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
  color: var(--text-primary, #1f2937);
}

.kanban-column-body {
  flex: 1;
  padding: 8px 12px 12px;
  min-height: 120px;
}

.kanban-card {
  background: var(--bg-card, #ffffff);
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, transform 0.15s;
}

.kanban-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card--overdue {
  border-left: 3px solid #EF4444;
}

.kanban-card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1f2937);
  margin-bottom: 8px;
}

.kanban-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-card-date {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
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
</style>
