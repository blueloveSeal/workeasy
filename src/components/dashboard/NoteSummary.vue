<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import AppCard from '@/components/common/AppCard.vue'

const noteStore = useNoteStore()
const router = useRouter()
onMounted(() => { noteStore.load() })

const recentNotes = computed(() => noteStore.notes.slice(0, 5))
const newNoteTitle = ref('')
const adding = ref(false)

function formatTime(dateStr: string) {
  const d = dayjs(dateStr)
  return d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? d.format('HH:mm') : d.format('MM-DD')
}

function openNote(note: { id: string }) {
  router.push(`/notes?edit=${note.id}`)
}

async function addQuickNote() {
  const title = newNoteTitle.value.trim()
  if (!title || adding.value) return
  adding.value = true
  try {
    const note = await noteStore.add({
      title,
      content: '',
      tags: [],
      isPinned: false,
    })
    newNoteTitle.value = ''
    router.push(`/notes?edit=${note.id}`)
  } finally {
    adding.value = false
  }
}

async function deleteNote(id: string) {
  await noteStore.remove(id)
}

async function togglePin(id: string) {
  await noteStore.togglePin(id)
}
</script>

<template>
  <AppCard title="笔记" :subtitle="noteStore.notes.length + ' 篇笔记'">
    <template #actions>
      <el-button text size="small" @click="router.push('/notes')">查看全部</el-button>
    </template>
    <div v-if="recentNotes.length" class="note-list">
      <div
        v-for="note in recentNotes"
        :key="note.id"
        class="note-item"
        @click="openNote(note)"
      >
        <el-icon
          class="pin-icon"
          :class="{ pinned: note.isPinned }"
          :size="14"
          @click.stop="togglePin(note.id)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        </el-icon>
        <span class="note-title">{{ note.title || '无标题' }}</span>
        <span class="note-time">{{ formatTime(note.updatedAt) }}</span>
        <el-button
          class="note-action-btn"
          size="small"
          text
          type="danger"
          @click.stop="deleteNote(note.id)"
        >
          <el-icon :size="14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></el-icon>
        </el-button>
      </div>
    </div>
    <div v-else class="empty-hint">暂无笔记</div>

    <div class="quick-add">
      <el-input
        v-model="newNoteTitle"
        placeholder="快速创建笔记..."
        size="small"
        @keyup.enter="addQuickNote"
        :disabled="adding"
      >
        <template #append>
          <el-button :disabled="!newNoteTitle.trim() || adding" @click="addQuickNote">
            <el-icon :size="14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </AppCard>
</template>

<style scoped>
.note-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.note-item { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.15s ease; }
.note-item:hover { background: var(--bg-input); }
.pin-icon { flex-shrink: 0; color: var(--text-muted); transition: color 0.15s ease; cursor: pointer; }
.pin-icon.pinned { color: var(--el-color-warning); }
.pin-icon:hover { color: var(--el-color-warning); }
.note-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.note-item:hover .note-title { color: var(--el-color-primary); }
.note-time { color: var(--text-muted); font-size: 12px; flex-shrink: 0; margin-left: auto; }
.note-action-btn { opacity: 0; transition: opacity 0.15s ease; flex-shrink: 0; padding: 2px !important; margin-left: 4px; }
.note-item:hover .note-action-btn { opacity: 1; }
.quick-add { margin-top: 8px; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
