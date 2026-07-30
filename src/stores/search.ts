import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SearchResult {
  module: 'task' | 'note' | 'bookmark'
  id: string
  title: string
  subtitle?: string
}

export const useSearchStore = defineStore('search', () => {
  const visible = ref(false)
  const query = ref('')
  const results = ref<SearchResult[]>([])

  function open() { visible.value = true }
  function close() {
    visible.value = false
    query.value = ''
    results.value = []
  }

  return { visible, query, results, open, close }
})
