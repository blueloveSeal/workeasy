import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Note } from '@/types/note'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])

  async function load() {
    notes.value = await db.notes.orderBy('updatedAt').reverse().toArray()
  }

  async function add(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newNote: Note = { ...note, id: genId(), createdAt: now, updatedAt: now }
    await db.notes.add(newNote)
    notes.value.unshift(newNote)
    return newNote
  }

  async function update(id: string, patch: Partial<Note>) {
    const updates = { ...patch, updatedAt: new Date().toISOString() }
    await db.notes.update(id, updates)
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(notes.value[idx], updates)
  }

  async function remove(id: string) {
    await db.notes.delete(id)
    notes.value = notes.value.filter(n => n.id !== id)
  }

  async function togglePin(id: string) {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      await update(id, { isPinned: !note.isPinned })
    }
  }

  return { notes, load, add, update, remove, togglePin }
})
