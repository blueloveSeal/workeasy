import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Task } from '@/types/task'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 每天自动生成的默认任务 */
const DEFAULT_DAILY_TASKS: Pick<Task, 'title' | 'status' | 'priority' | 'tags'>[] = [
  { title: '邮件查收', status: 'todo', priority: 'medium', tags: ['每日'] },
  { title: '事务中心', status: 'todo', priority: 'medium', tags: ['每日'] },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])

  /** 检查并生成今日默认任务 */
  async function ensureDailyTasks() {
    const today = todayStr()
    const existing = await db.tasks
      .where('dueDate')
      .equals(today)
      .and(t => t.tags.includes('每日'))
      .toArray()
    if (existing.length > 0) return

    const now = new Date().toISOString()
    for (const tpl of DEFAULT_DAILY_TASKS) {
      const task: Task = {
        ...tpl,
        id: genId(),
        dueDate: today,
        createdAt: now,
        updatedAt: now,
      }
      await db.tasks.add(task)
    }
  }

  async function load() {
    await ensureDailyTasks()
    tasks.value = await db.tasks.orderBy('createdAt').reverse().toArray()
  }

  async function add(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newTask: Task = { ...task, id: genId(), createdAt: now, updatedAt: now }
    await db.tasks.add(newTask)
    tasks.value.unshift(newTask)
    return newTask
  }

  async function update(id: string, patch: Partial<Task>) {
    const updates = { ...patch, updatedAt: new Date().toISOString() }
    await db.tasks.update(id, updates)
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) tasks.value[idx] = { ...tasks.value[idx], ...updates }
  }

  async function remove(id: string) {
    await db.tasks.delete(id)
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  async function batchUpdate(ids: string[], patch: Partial<Task>) {
    const now = new Date().toISOString()
    const updates = { ...patch, updatedAt: now }
    for (const id of ids) {
      await db.tasks.update(id, updates)
    }
    await load()
  }

  async function batchRemove(ids: string[]) {
    await db.tasks.bulkDelete(ids)
    tasks.value = tasks.value.filter(t => !ids.includes(t.id))
  }

  return { tasks, load, add, update, remove, batchUpdate, batchRemove }
})
