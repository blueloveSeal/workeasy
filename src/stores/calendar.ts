import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { CalendarEvent } from '@/types/calendar'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>([])

  async function load() {
    events.value = await db.events.orderBy('startTime').toArray()
  }

  async function add(event: Omit<CalendarEvent, 'id' | 'createdAt'>) {
    const newEvent: CalendarEvent = {
      ...event,
      id: genId(),
      createdAt: new Date().toISOString(),
    }
    await db.events.add(newEvent)
    events.value.push(newEvent)
    return newEvent
  }

  async function update(id: string, patch: Partial<CalendarEvent>) {
    await db.events.update(id, patch)
    const idx = events.value.findIndex(e => e.id === id)
    if (idx !== -1) Object.assign(events.value[idx], patch)
  }

  async function remove(id: string) {
    await db.events.delete(id)
    events.value = events.value.filter(e => e.id !== id)
  }

  function getEventsForDate(date: string) {
    return events.value.filter(e => e.startTime.startsWith(date))
  }

  return { events, load, add, update, remove, getEventsForDate }
})
