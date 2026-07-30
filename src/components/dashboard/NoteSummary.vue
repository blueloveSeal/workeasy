<script setup lang="ts">
import { onMounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import AppCard from '@/components/common/AppCard.vue'

const noteStore = useNoteStore()
const router = useRouter()
onMounted(() => { noteStore.load() })

const recentNotes = noteStore.notes.slice(0, 3)

function formatTime(dateStr: string) {
  const d = dayjs(dateStr)
  return d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? d.format('HH:mm') : d.format('MM-DD')
}
</script>

<template>
  <AppCard title="笔记" :subtitle="noteStore.notes.length + ' 篇笔记'">
    <template #actions>
      <el-button text size="small" @click="router.push('/notes')">查看全部</el-button>
    </template>
    <div v-if="recentNotes.length" class="note-list">
      <div v-for="note in recentNotes" :key="note.id" class="note-item">
        <span class="note-title">{{ note.title || '无标题' }}</span>
        <span class="note-time">{{ formatTime(note.updatedAt) }}</span>
      </div>
    </div>
    <div v-else class="empty-hint">暂无笔记</div>
  </AppCard>
</template>

<style scoped>
.note-list { display: flex; flex-direction: column; gap: 10px; }
.note-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.note-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.note-time { color: var(--text-muted); font-size: 12px; flex-shrink: 0; margin-left: 8px; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
