<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import AppCard from '@/components/common/AppCard.vue'

const calendarStore = useCalendarStore()
const router = useRouter()
onMounted(() => { calendarStore.load() })

const today = dayjs().format('YYYY-MM-DD')
const todayEvents = computed(() =>
  calendarStore.events.filter(e => e.startTime.startsWith(today)).sort((a, b) => a.startTime.localeCompare(b.startTime))
)

function formatTime(dateStr: string) { return dayjs(dateStr).format('HH:mm') }
</script>

<template>
  <AppCard title="Schedule" :subtitle="todayEvents.length + ' events today'">
    <template #actions>
      <el-button text size="small" @click="router.push('/calendar')">View All</el-button>
    </template>
    <div v-if="todayEvents.length" class="event-list">
      <div v-for="event in todayEvents" :key="event.id" class="event-item">
        <span class="event-dot" :style="{ background: event.color }" />
        <span class="event-time">{{ event.isAllDay ? 'All Day' : formatTime(event.startTime) }}</span>
        <span class="event-title">{{ event.title }}</span>
      </div>
    </div>
    <div v-else class="empty-hint">No events today</div>
  </AppCard>
</template>

<style scoped>
.event-list { display: flex; flex-direction: column; gap: 10px; }
.event-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.event-time { color: var(--text-muted); font-size: 12px; width: 48px; flex-shrink: 0; }
.event-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
