export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  color: string
  isAllDay: boolean
  reminder?: number | null
  createdAt: string
}
