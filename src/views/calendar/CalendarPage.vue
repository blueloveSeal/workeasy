<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Delete, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isBetween from 'dayjs/plugin/isBetween'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import { useCalendarStore } from '@/stores/calendar'
import type { CalendarEvent } from '@/types/calendar'

dayjs.extend(isoWeek)
dayjs.extend(isBetween)

// --- Store ---
const calendarStore = useCalendarStore()

// --- View mode ---
type ViewMode = 'month' | 'week' | 'day'
const viewMode = ref<ViewMode>('month')

// --- Current date navigation ---
const currentDate = ref(dayjs())

const prevPeriod = () => {
  if (viewMode.value === 'month') currentDate.value = currentDate.value.subtract(1, 'month')
  else if (viewMode.value === 'week') currentDate.value = currentDate.value.subtract(1, 'week')
  else currentDate.value = currentDate.value.subtract(1, 'day')
}

const nextPeriod = () => {
  if (viewMode.value === 'month') currentDate.value = currentDate.value.add(1, 'month')
  else if (viewMode.value === 'week') currentDate.value = currentDate.value.add(1, 'week')
  else currentDate.value = currentDate.value.add(1, 'day')
}

const goToToday = () => {
  currentDate.value = dayjs()
}

const headerTitle = computed(() => {
  if (viewMode.value === 'month') return currentDate.value.format('YYYY MMMM')
  if (viewMode.value === 'week') {
    const start = currentDate.value.startOf('week')
    const end = currentDate.value.endOf('week')
    return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
  }
  return currentDate.value.format('YYYY MMMM D, dddd')
})

// --- Selected date (for month view side panel) ---
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

const selectedDateEvents = computed(() => {
  return calendarStore.events.filter((e) => {
    const eventDate = dayjs(e.startTime).format('YYYY-MM-DD')
    return eventDate === selectedDate.value
  })
})

// --- Preset colors ---
const PRESET_COLORS = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#9B59B6', '#1ABC9C', '#E91E63',
  '#FF9800', '#795548',
]

// --- Reminder options ---
const REMINDER_OPTIONS = [
  { label: '无', value: null },
  { label: '5分钟前', value: 5 },
  { label: '15分钟前', value: 15 },
  { label: '30分钟前', value: 30 },
  { label: '1小时前', value: 60 },
]

// --- Event dialog ---
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingEventId = ref<string | null>(null)
const formRef = ref<FormInstance>()

interface EventFormData {
  title: string
  description: string
  startTime: string
  endTime: string
  color: string
  isAllDay: boolean
  reminder: number | null
}

const defaultForm = (): EventFormData => ({
  title: '',
  description: '',
  startTime: dayjs().format('YYYY-MM-DD HH:mm'),
  endTime: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm'),
  color: PRESET_COLORS[0],
  isAllDay: false,
  reminder: null,
})

const eventForm = reactive<EventFormData>(defaultForm())

const formRules: FormRules = {
  title: [{ required: true, message: '请输入日程标题', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const openNewEventDialog = (date?: string) => {
  isEditing.value = false
  editingEventId.value = null
  Object.assign(eventForm, defaultForm())
  if (date) {
    eventForm.startTime = dayjs(date).format('YYYY-MM-DD HH:mm')
    eventForm.endTime = dayjs(date).add(1, 'hour').format('YYYY-MM-DD HH:mm')
  }
  dialogVisible.value = true
}

const openEditEventDialog = (event: CalendarEvent) => {
  isEditing.value = true
  editingEventId.value = event.id
  Object.assign(eventForm, {
    title: event.title,
    description: event.description || '',
    startTime: dayjs(event.startTime).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs(event.endTime).format('YYYY-MM-DD HH:mm'),
    color: event.color,
    isAllDay: event.isAllDay,
    reminder: event.reminder ?? null,
  })
  dialogVisible.value = true
}

const handleSaveEvent = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (dayjs(eventForm.endTime).isBefore(dayjs(eventForm.startTime))) {
      ElMessage.warning('结束时间必须晚于开始时间')
      return
    }

    const payload = {
      title: eventForm.title,
      description: eventForm.description || undefined,
      startTime: dayjs(eventForm.startTime).toISOString(),
      endTime: dayjs(eventForm.endTime).toISOString(),
      color: eventForm.color,
      isAllDay: eventForm.isAllDay,
      reminder: eventForm.reminder,
    }

    if (isEditing.value && editingEventId.value) {
      await calendarStore.update(editingEventId.value, payload)
      ElMessage.success('日程已更新')
    } else {
      await calendarStore.add(payload)
      ElMessage.success('日程已创建')
    }

    dialogVisible.value = false
  })
}

const handleDeleteEvent = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除此日程吗？', '删除日程', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await calendarStore.remove(id)
    ElMessage.success('日程已删除')
  } catch {
    // cancelled
  }
}

// --- Month view grid ---
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const monthGrid = computed(() => {
  const start = currentDate.value.startOf('month').startOf('week')
  const end = currentDate.value.endOf('month').endOf('week')
  const days: dayjs.Dayjs[] = []
  let cursor = start
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    days.push(cursor)
    cursor = cursor.add(1, 'day')
  }
  return days
})

const getEventsForDate = (date: dayjs.Dayjs): CalendarEvent[] => {
  const dateStr = date.format('YYYY-MM-DD')
  return calendarStore.events.filter((e) => {
    const eventDate = dayjs(e.startTime).format('YYYY-MM-DD')
    return eventDate === dateStr
  })
}

const isToday = (date: dayjs.Dayjs): boolean => {
  return date.isSame(dayjs(), 'day')
}

const isCurrentMonth = (date: dayjs.Dayjs): boolean => {
  return date.month() === currentDate.value.month()
}

const isSelected = (date: dayjs.Dayjs): boolean => {
  return date.format('YYYY-MM-DD') === selectedDate.value
}

const handleDateClick = (date: dayjs.Dayjs) => {
  selectedDate.value = date.format('YYYY-MM-DD')
  const events = getEventsForDate(date)
  if (events.length === 0) {
    openNewEventDialog(date.format('YYYY-MM-DD'))
  }
}

// --- Week view ---
const HOURS_START = 6
const HOURS_END = 24
const HOUR_HEIGHT = 60

const weekDays = computed(() => {
  const start = currentDate.value.startOf('week')
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
})

const hours = computed(() => {
  return Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i)
})

const getEventPosition = (event: CalendarEvent) => {
  const start = dayjs(event.startTime)
  const end = dayjs(event.endTime)
  const startMinutes = (start.hour() - HOURS_START) * 60 + start.minute()
  const endMinutes = (end.hour() - HOURS_START) * 60 + end.minute()
  const top = (startMinutes / 60) * HOUR_HEIGHT
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20)
  return { top, height }
}

const getEventsForDayAndHour = (date: dayjs.Dayjs): CalendarEvent[] => {
  const dateStr = date.format('YYYY-MM-DD')
  return calendarStore.events.filter((e) => {
    if (e.isAllDay) return false
    const eventDate = dayjs(e.startTime).format('YYYY-MM-DD')
    return eventDate === dateStr
  })
}

const getAllDayEvents = (date: dayjs.Dayjs): CalendarEvent[] => {
  const dateStr = date.format('YYYY-MM-DD')
  return calendarStore.events.filter((e) => {
    if (!e.isAllDay) return false
    const eventDate = dayjs(e.startTime).format('YYYY-MM-DD')
    return eventDate === dateStr
  })
}

// --- Day view ---
const dayViewEvents = computed(() => {
  const dateStr = currentDate.value.format('YYYY-MM-DD')
  return calendarStore.events.filter((e) => {
    const eventDate = dayjs(e.startTime).format('YYYY-MM-DD')
    return eventDate === dateStr && !e.isAllDay
  })
})

const dayViewAllDayEvents = computed(() => {
  const dateStr = currentDate.value.format('YYYY-MM-DD')
  return calendarStore.events.filter((e) => {
    const eventDate = dayjs(e.startTime).format('YYYY-MM-DD')
    return eventDate === dateStr && e.isAllDay
  })
})

// --- Browser notifications ---
let notificationTimer: ReturnType<typeof setInterval> | null = null
const notifiedEvents = ref<Set<string>>(new Set())

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

const checkUpcomingEvents = () => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = dayjs()
  calendarStore.events.forEach((event) => {
    if (event.reminder == null || notifiedEvents.value.has(event.id)) return
    const startTime = dayjs(event.startTime)
    const reminderTime = startTime.subtract(event.reminder, 'minute')
    const diff = reminderTime.diff(now, 'minute')
    if (diff >= 0 && diff <= 1) {
      notifiedEvents.value.add(event.id)
      new Notification('日程提醒', {
        body: `${event.title} 将在${event.reminder}分钟后开始`,
        icon: '/favicon.ico',
      })
    }
  })
}

// --- Lifecycle ---
onMounted(async () => {
  await calendarStore.load()
  await requestNotificationPermission()
  notificationTimer = setInterval(checkUpcomingEvents, 60000)
})

onUnmounted(() => {
  if (notificationTimer) clearInterval(notificationTimer)
})
</script>

<template>
  <div class="calendar-page">
    <TopBar />

    <div class="calendar-content">
      <!-- Header -->
      <div class="calendar-header">
        <h2 class="page-title">日程</h2>
        <div class="header-actions">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button value="month">月</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="day">日</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="openNewEventDialog()">
            <el-icon><Plus /></el-icon>
            新建日程
          </el-button>
        </div>
      </div>

      <!-- Navigation bar -->
      <div class="calendar-nav">
        <div class="nav-left">
          <el-button :icon="ArrowLeft" circle size="small" @click="prevPeriod" />
          <el-button :icon="ArrowRight" circle size="small" @click="nextPeriod" />
          <el-button size="small" @click="goToToday">今天</el-button>
        </div>
        <span class="nav-title">{{ headerTitle }}</span>
      </div>

      <!-- ==================== MONTH VIEW ==================== -->
      <template v-if="viewMode === 'month'">
        <div class="month-view">
          <div class="month-grid-wrapper">
            <!-- Weekday headers -->
            <div class="weekday-header">
              <div v-for="day in WEEKDAYS" :key="day" class="weekday-cell">{{ day }}</div>
            </div>

            <!-- Date grid -->
            <div class="month-grid">
              <div
                v-for="(date, idx) in monthGrid"
                :key="idx"
                class="month-day-cell"
                :class="{
                  'is-today': isToday(date),
                  'is-other-month': !isCurrentMonth(date),
                  'is-selected': isSelected(date),
                }"
                @click="handleDateClick(date)"
              >
                <span class="day-number">{{ date.date() }}</span>
                <div class="event-dots">
                  <template v-for="event in getEventsForDate(date).slice(0, 3)" :key="event.id">
                    <div
                      class="event-dot-row"
                      @click.stop="openEditEventDialog(event)"
                    >
                      <span
                        class="event-dot"
                        :style="{ backgroundColor: event.color }"
                      ></span>
                      <span class="event-dot-title">{{ event.title }}</span>
                    </div>
                  </template>
                  <div
                    v-if="getEventsForDate(date).length > 3"
                    class="event-more"
                  >
                    +{{ getEventsForDate(date).length - 3 }} 更多
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Side panel for selected date -->
          <div class="side-panel">
            <div class="side-panel-header">
              <h3>{{ dayjs(selectedDate).format('MMM D, YYYY') }}</h3>
              <el-button type="primary" size="small" @click="openNewEventDialog(selectedDate)">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
            <div class="side-panel-body">
              <div
                v-for="event in selectedDateEvents"
                :key="event.id"
                class="side-event-card"
                :style="{ borderLeftColor: event.color }"
              >
                <div class="side-event-title">{{ event.title }}</div>
                <div class="side-event-time">
                  <template v-if="event.isAllDay">全天</template>
                  <template v-else>
                    {{ dayjs(event.startTime).format('HH:mm') }} - {{ dayjs(event.endTime).format('HH:mm') }}
                  </template>
                </div>
                <div v-if="event.description" class="side-event-desc">{{ event.description }}</div>
                <div class="side-event-actions">
                  <el-button link type="primary" size="small" @click="openEditEventDialog(event)">编辑</el-button>
                  <el-button link type="danger" size="small" @click="handleDeleteEvent(event.id)">删除</el-button>
                </div>
              </div>
              <div v-if="selectedDateEvents.length === 0" class="side-panel-empty">
                当天暂无日程
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== WEEK VIEW ==================== -->
      <template v-if="viewMode === 'week'">
        <div class="week-view">
          <!-- All-day row -->
          <div class="week-allday-row">
            <div class="time-gutter-label">全天</div>
            <div
              v-for="date in weekDays"
              :key="date.format('YYYY-MM-DD')"
              class="week-allday-cell"
            >
              <div
                v-for="event in getAllDayEvents(date)"
                :key="event.id"
                class="allday-event"
                :style="{ backgroundColor: event.color }"
                @click="openEditEventDialog(event)"
              >
                {{ event.title }}
              </div>
            </div>
          </div>

          <!-- Time grid -->
          <div class="week-time-grid">
            <!-- Time gutter -->
            <div class="time-gutter">
              <div
                v-for="hour in hours"
                :key="hour"
                class="time-gutter-cell"
                :style="{ height: HOUR_HEIGHT + 'px' }"
              >
                {{ String(hour).padStart(2, '0') }}:00
              </div>
            </div>

            <!-- Day columns -->
            <div
              v-for="date in weekDays"
              :key="date.format('YYYY-MM-DD')"
              class="week-day-column"
              :class="{ 'is-today': isToday(date) }"
            >
              <!-- Hour lines -->
              <div
                v-for="hour in hours"
                :key="hour"
                class="hour-line"
                :style="{ height: HOUR_HEIGHT + 'px' }"
                @click="openNewEventDialog(date.format('YYYY-MM-DD') + ' ' + String(hour).padStart(2, '0') + ':00')"
              ></div>

              <!-- Event blocks -->
              <div
                v-for="event in getEventsForDayAndHour(date)"
                :key="event.id"
                class="week-event-block"
                :style="{
                  top: getEventPosition(event).top + 'px',
                  height: getEventPosition(event).height + 'px',
                  backgroundColor: event.color,
                }"
                @click.stop="openEditEventDialog(event)"
              >
                <div class="event-block-title">{{ event.title }}</div>
                <div class="event-block-time">
                  {{ dayjs(event.startTime).format('HH:mm') }} - {{ dayjs(event.endTime).format('HH:mm') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ==================== DAY VIEW ==================== -->
      <template v-if="viewMode === 'day'">
        <div class="day-view">
          <!-- All-day events -->
          <div v-if="dayViewAllDayEvents.length > 0" class="day-allday-row">
            <span class="day-allday-label">全天</span>
            <div class="day-allday-events">
              <div
                v-for="event in dayViewAllDayEvents"
                :key="event.id"
                class="allday-event"
                :style="{ backgroundColor: event.color }"
                @click="openEditEventDialog(event)"
              >
                {{ event.title }}
              </div>
            </div>
          </div>

          <!-- Time axis -->
          <div class="day-time-grid">
            <div class="time-gutter">
              <div
                v-for="hour in hours"
                :key="hour"
                class="time-gutter-cell"
                :style="{ height: HOUR_HEIGHT + 'px' }"
              >
                {{ String(hour).padStart(2, '0') }}:00
              </div>
            </div>

            <div class="day-column">
              <div
                v-for="hour in hours"
                :key="hour"
                class="hour-line"
                :style="{ height: HOUR_HEIGHT + 'px' }"
                @click="openNewEventDialog(currentDate.format('YYYY-MM-DD') + ' ' + String(hour).padStart(2, '0') + ':00')"
              ></div>

              <div
                v-for="event in dayViewEvents"
                :key="event.id"
                class="day-event-block"
                :style="{
                  top: getEventPosition(event).top + 'px',
                  height: getEventPosition(event).height + 'px',
                  backgroundColor: event.color,
                }"
                @click.stop="openEditEventDialog(event)"
              >
                <div class="event-block-title">{{ event.title }}</div>
                <div class="event-block-time">
                  {{ dayjs(event.startTime).format('HH:mm') }} - {{ dayjs(event.endTime).format('HH:mm') }}
                </div>
                <div v-if="event.description" class="event-block-desc">{{ event.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ==================== EVENT DIALOG ==================== -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑日程' : '新建日程'"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="eventForm"
        :rules="formRules"
        label-position="top"
        class="event-form"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入日程标题" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入日程描述"
          />
        </el-form-item>

        <el-form-item label="全天">
          <el-switch v-model="eventForm.isAllDay" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="eventForm.startTime"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                :disabled="eventForm.isAllDay"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="eventForm.endTime"
                type="datetime"
                placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                :disabled="eventForm.isAllDay"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="颜色">
          <div class="color-picker-row">
            <div
              v-for="c in PRESET_COLORS"
              :key="c"
              class="color-swatch"
              :class="{ active: eventForm.color === c }"
              :style="{ backgroundColor: c }"
              @click="eventForm.color = c"
            ></div>
          </div>
        </el-form-item>

        <el-form-item label="提醒">
          <el-select v-model="eventForm.reminder" placeholder="选择提醒时间" style="width: 100%">
            <el-option
              v-for="opt in REMINDER_OPTIONS"
              :key="opt.label"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button
          v-if="isEditing"
          type="danger"
          @click="handleDeleteEvent(editingEventId!)"
        >
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEvent">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Search Dialog -->
    <SearchDialog />
  </div>
</template>

<style scoped>
.calendar-page {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.calendar-content {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* --- Header --- */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* --- Navigation --- */
.calendar-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* =============================================
   MONTH VIEW
   ============================================= */
.month-view {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.month-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--border-color);
}

.weekday-cell {
  text-align: center;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.month-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
}

.month-day-cell {
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 6px 8px;
  min-height: 90px;
  cursor: pointer;
  transition: background 0.15s ease;
  overflow: hidden;
}

.month-day-cell:nth-child(7n) {
  border-right: none;
}

.month-day-cell:hover {
  background: var(--bg-secondary);
}

.month-day-cell.is-other-month {
  opacity: 0.4;
}

.month-day-cell.is-today .day-number {
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.month-day-cell.is-selected {
  background: var(--el-color-primary-light-9);
}

.day-number {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: inline-block;
}

.event-dots {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-dot-row {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border-radius: 3px;
  padding: 1px 4px;
  transition: background 0.15s;
}

.event-dot-row:hover {
  background: var(--bg-secondary);
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-dot-title {
  font-size: 11px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-more {
  font-size: 11px;
  color: var(--text-muted);
  padding-left: 4px;
}

/* --- Side Panel --- */
.side-panel {
  width: 300px;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.side-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.side-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.side-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.side-event-card {
  border-left: 3px solid var(--color-primary);
  padding: 12px;
  margin-bottom: 10px;
  background: var(--bg-secondary);
  border-radius: 0 8px 8px 0;
}

.side-event-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.side-event-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.side-event-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.side-event-actions {
  display: flex;
  gap: 8px;
}

.side-panel-empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--text-muted);
  font-size: 14px;
}

/* =============================================
   WEEK VIEW
   ============================================= */
.week-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.week-allday-row {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  min-height: 36px;
}

.time-gutter-label {
  width: 72px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--border-color);
}

.week-allday-cell {
  flex: 1;
  padding: 4px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.week-allday-cell:last-child {
  border-right: none;
}

.allday-event {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.week-time-grid {
  flex: 1;
  display: flex;
  overflow-y: auto;
}

.time-gutter {
  width: 72px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  min-height: 1080px; /* 18 hours * 60px */
}

.time-gutter-cell {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
  padding: 0 10px 0 4px;
  position: relative;
  top: -6px;
}

.week-day-column {
  flex: 1;
  position: relative;
  border-right: 1px solid var(--border-color);
  min-height: 1080px; /* 18 hours * 60px */
}

.week-day-column:last-child {
  border-right: none;
}

.week-day-column.is-today {
  background: var(--el-color-primary-light-9);
}

.hour-line {
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;
}

.hour-line:hover {
  background: var(--bg-secondary);
}

.week-event-block {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 6px;
  padding: 4px 8px;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s, box-shadow 0.15s;
}

.week-event-block:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.event-block-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-block-time {
  font-size: 11px;
  opacity: 0.85;
}

/* =============================================
   DAY VIEW
   ============================================= */
.day-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.day-allday-row {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
  align-items: center;
}

.day-allday-label {
  font-size: 12px;
  color: var(--text-muted);
  width: 72px;
  flex-shrink: 0;
  text-align: center;
  padding-right: 0;
}

.day-allday-events {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-time-grid {
  flex: 1;
  display: flex;
  overflow-y: auto;
}

.day-column {
  flex: 1;
  position: relative;
  min-height: 1080px; /* 18 hours * 60px */
}

.day-event-block {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s, box-shadow 0.15s;
}

.day-event-block:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.event-block-desc {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Event Form Dialog --- */
.event-form {
  padding: 0 4px;
}

.color-picker-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s, border-color 0.15s;
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch.active {
  border-color: var(--text-primary);
  transform: scale(1.15);
}
</style>
