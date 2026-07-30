import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Task } from '@/types/task'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])

  async function load() {
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
    if (idx !== -1) Object.assign(tasks.value[idx], updates)
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
