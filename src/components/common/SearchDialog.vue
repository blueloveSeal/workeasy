<script setup lang="ts">
import { watch } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useSearch } from '@/composables/useSearch'
import { Search } from '@element-plus/icons-vue'

const searchStore = useSearchStore()
const { doSearch, navigateTo } = useSearch()

watch(() => searchStore.query, (val) => {
  doSearch(val)
})

const moduleLabels = {
  task: 'Tasks',
  note: 'Notes',
  bookmark: 'Bookmarks',
}
</script>

<template>
  <el-dialog
    v-model="searchStore.visible"
    :show-close="false"
    width="560px"
    class="search-dialog"
    @close="searchStore.close()"
  >
    <div class="search-input-wrapper">
      <el-icon :size="20" class="search-icon"><Search /></el-icon>
      <input
        v-model="searchStore.query"
        placeholder="Search tasks, notes, bookmarks..."
        class="search-input"
        autofocus
      />
      <kbd class="search-kbd">ESC</kbd>
    </div>

    <div v-if="searchStore.results.length" class="search-results">
      <div
        v-for="(result, idx) in searchStore.results"
        :key="`${result.module}-${result.id}-${idx}`"
        class="search-result-item"
        @click="navigateTo(result)"
      >
        <span class="result-module">{{ moduleLabels[result.module] }}</span>
        <span class="result-title">{{ result.title }}</span>
        <span v-if="result.subtitle" class="result-subtitle">{{ result.subtitle }}</span>
      </div>
    </div>

    <div v-else-if="searchStore.query.trim()" class="search-empty">
      No results found
    </div>
  </el-dialog>
</template>

<style scoped>
.search-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.search-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-kbd {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  background: var(--bg-input);
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-result-item:hover {
  background: var(--bg-input);
}

.result-module {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-primary);
  color: #fff;
  flex-shrink: 0;
}

.result-title {
  font-size: 14px;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
