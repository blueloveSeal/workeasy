import { computed } from 'vue'
import dayjs from 'dayjs'

export function useGreeting() {
  const greeting = computed(() => {
    const hour = dayjs().hour()
    if (hour >= 6 && hour < 12) return 'Good Morning'
    if (hour >= 12 && hour < 14) return 'Good Afternoon'
    if (hour >= 14 && hour < 18) return 'Good Afternoon'
    if (hour >= 18 && hour < 23) return 'Good Evening'
    return 'Late night, take care'
  })

  return { greeting }
}
