import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Bookmark } from '@/types/bookmark'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarks = ref<Bookmark[]>([])

  async function load() {
    bookmarks.value = await db.bookmarks.orderBy('createdAt').reverse().toArray()
  }

  async function add(bookmark: Omit<Bookmark, 'id' | 'createdAt'>) {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: genId(),
      createdAt: new Date().toISOString(),
    }
    await db.bookmarks.add(newBookmark)
    bookmarks.value.unshift(newBookmark)
    return newBookmark
  }

  async function update(id: string, patch: Partial<Bookmark>) {
    await db.bookmarks.update(id, patch)
    const idx = bookmarks.value.findIndex(b => b.id === id)
    if (idx !== -1) Object.assign(bookmarks.value[idx], patch)
  }

  async function remove(id: string) {
    await db.bookmarks.delete(id)
    bookmarks.value = bookmarks.value.filter(b => b.id !== id)
  }

  return { bookmarks, load, add, update, remove }
})
