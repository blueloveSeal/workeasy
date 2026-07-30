import { ref } from 'vue'
import { useSearchStore, type SearchResult } from '@/stores/search'
import { useTaskStore } from '@/stores/task'
import { useNoteStore } from '@/stores/note'
import { useBookmarkStore } from '@/stores/bookmark'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

export function useSearch() {
  const searchStore = useSearchStore()
  const taskStore = useTaskStore()
  const noteStore = useNoteStore()
  const bookmarkStore = useBookmarkStore()
  const router = useRouter()
  const loading = ref(false)

  const doSearch = useDebounceFn(async (q: string) => {
    if (!q.trim()) {
      searchStore.results = []
      return
    }
    loading.value = true
    const keyword = q.toLowerCase()
    const results: SearchResult[] = []

    const taskMatches = taskStore.tasks
      .filter(t => t.title.toLowerCase().includes(keyword) || t.description?.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map(t => ({ module: 'task' as const, id: t.id, title: t.title, subtitle: t.status }))

    const noteMatches = noteStore.notes
      .filter(n => n.title.toLowerCase().includes(keyword) || n.content.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map(n => ({ module: 'note' as const, id: n.id, title: n.title, subtitle: n.category }))

    const bookmarkMatches = bookmarkStore.bookmarks
      .filter(b => b.title.toLowerCase().includes(keyword) || b.url.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map(b => ({ module: 'bookmark' as const, id: b.id, title: b.title, subtitle: b.url }))

    results.push(...taskMatches, ...noteMatches, ...bookmarkMatches)
    searchStore.results = results
    loading.value = false
  }, 300)

  function navigateTo(result: SearchResult) {
    const routeMap = { task: 'Tasks', note: 'Notes', bookmark: 'Bookmarks' }
    router.push({ name: routeMap[result.module] })
    searchStore.close()
  }

  return { doSearch, navigateTo, loading }
}
