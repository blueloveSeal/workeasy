<template>
  <div class="note-page">
    <TopBar />
    <SearchDialog v-model:visible="searchDialogVisible" />

    <div class="note-container">
      <!-- Left Sidebar -->
      <aside class="note-sidebar">
        <div class="sidebar-header">
          <el-input
            v-model="searchQuery"
            placeholder="搜索笔记..."
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select
            v-model="selectedCategory"
            placeholder="分类"
            clearable
            class="category-filter"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
          <el-button type="primary" icon="Plus" circle @click="createNewNote" />
        </div>

        <div class="note-list">
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="note-item"
            :class="{ active: currentNote?.id === note.id }"
            @click="selectNote(note)"
          >
            <div class="note-item-content">
              <h4 class="note-title">{{ note.title || '无标题' }}</h4>
              <div class="note-meta">
                <el-tag size="small" v-if="note.category">{{ note.category }}</el-tag>
                <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
              </div>
            </div>
            <div class="note-actions">
              <el-button
                text
                :icon="note.isPinned ? 'StarFilled' : 'Star'"
                :type="note.isPinned ? 'warning' : ''"
                @click.stop="togglePin(note)"
              />
              <el-button
                text
                icon="Delete"
                type="danger"
                class="delete-btn"
                @click.stop="deleteNote(note.id)"
              />
            </div>
          </div>

          <div v-if="filteredNotes.length === 0" class="empty-list">
            <el-empty description="暂无笔记" />
          </div>
        </div>
      </aside>

      <!-- Right Editor Area -->
      <main class="note-editor">
        <div v-if="currentNote" class="editor-wrapper">
          <div class="editor-header">
            <el-input
              v-model="currentNote.title"
              placeholder="笔记标题"
              class="title-input"
              @input="handleTitleChange"
            />
            <div class="editor-actions">
              <el-button icon="Download" @click="exportNote">导出</el-button>
            </div>
          </div>
          <MdEditor
            v-model="currentNote.content"
            language="zh-CN"
            :theme="editorTheme"
            class="markdown-editor"
            @on-change="handleContentChange"
          />
        </div>

        <div v-else class="empty-state">
          <el-empty description="选择或创建一个笔记" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import { useNoteStore } from '@/stores/note'
import { useThemeStore } from '@/stores/theme'
import type { Note } from '@/types/note'

const noteStore = useNoteStore()
const themeStore = useThemeStore()

const searchQuery = ref('')
const selectedCategory = ref('')
const searchDialogVisible = ref(false)
const currentNote = ref<Note | null>(null)
let saveTimer: ReturnType<typeof setTimeout> | null = null

const categories = computed(() => {
  const cats = new Set<string>()
  noteStore.notes.forEach((note) => {
    if (note.category) cats.add(note.category)
  })
  return Array.from(cats)
})

const editorTheme = computed(() => themeStore.mode === 'dark' ? 'dark' : 'light')

const filteredNotes = computed(() => {
  let notes = [...noteStore.notes]

  if (selectedCategory.value) {
    notes = notes.filter((n) => n.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
    )
  }

  // Sort: pinned first, then by updatedAt desc
  notes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
  })

  return notes
})

function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function createNewNote() {
  const noteData = {
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    isPinned: false,
  }
  noteStore.add(noteData).then((n) => {
    currentNote.value = n
  })
}

function selectNote(note: Note) {
  currentNote.value = note
}

function togglePin(note: Note) {
  noteStore.update(note.id, { isPinned: !note.isPinned })
}

function deleteNote(id: string) {
  noteStore.remove(id)
  if (currentNote.value?.id === id) {
    currentNote.value = null
  }
  ElMessage.success('笔记已删除')
}

function handleTitleChange() {
  if (!currentNote.value) return
  debouncedSave()
}

function handleContentChange() {
  if (!currentNote.value) return
  debouncedSave()
}

function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (currentNote.value) {
      noteStore.update(currentNote.value.id, {
        title: currentNote.value.title,
        content: currentNote.value.content,
        category: currentNote.value.category,
        tags: currentNote.value.tags,
        isPinned: currentNote.value.isPinned,
      })
    }
  }, 2000)
}

function exportNote() {
  if (!currentNote.value) return

  const blob = new Blob([currentNote.value.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentNote.value.title || '未命名'}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('笔记已导出')
}

// Watch for note updates from store to keep currentNote in sync
watch(
  () => noteStore.notes,
  (notes) => {
    if (currentNote.value) {
      const updated = notes.find((n) => n.id === currentNote.value?.id)
      if (updated) {
        currentNote.value = updated
      } else {
        currentNote.value = null
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.note-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.note-container {
  flex: 1;
  display: flex;
  width: min(100% - 48px, 1320px);
  margin: 24px auto 32px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg-card) 94%, transparent);
  border: 1px solid var(--border-color);
  border-radius: 24px 24px 24px 9px;
  box-shadow: var(--shadow-card);
}

/* Left Sidebar */
.note-sidebar {
  width: 310px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--bg-secondary) 58%, transparent);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input {
  width: 100%;
}

.category-filter {
  width: 100%;
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.note-item {
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 11px 11px 11px 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: background-color 0.2s;
}

.note-item:hover {
  background: var(--bg-card);
}

.note-item.active {
  background: color-mix(in srgb, var(--color-primary) 10%, var(--bg-card));
  border-left: 3px solid var(--color-primary);
}

.note-item-content {
  flex: 1;
  min-width: 0;
}

.note-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.note-date {
  color: var(--el-text-color-secondary);
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.delete-btn {
  display: none;
}

.note-item:hover .delete-btn {
  display: inline-flex;
}

.empty-list {
  padding: 40px 0;
  text-align: center;
}

/* Right Editor */
.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: 22px 28px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-input {
  flex: 1;
}

.title-input :deep(.el-input__inner) {
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 750;
  letter-spacing: -0.045em;
  border: none;
  padding: 0;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.markdown-editor {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 760px) {
  .note-container {
    width: calc(100% - 24px);
    margin: 16px auto 24px;
    flex-direction: column;
    border-radius: 18px 18px 18px 7px;
  }

  .note-sidebar {
    width: 100%;
    height: 230px;
    flex: 0 0 auto;
    border-right: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .editor-header {
    padding: 16px;
    flex-wrap: wrap;
  }
}
</style>
