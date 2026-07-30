import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { ThemeMode } from '@/types/theme'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('light')
  const backgroundType = ref<'video' | 'gif' | 'image' | 'color' | null>(null)
  const backgroundBlobId = ref<string | null>(null)
  const overlayOpacity = ref(30)
  const backgroundUrl = ref<string | null>(null)

  async function init() {
    const setting = await db.themeSettings.get('default')
    if (setting) {
      mode.value = setting.mode
      backgroundType.value = setting.backgroundType ?? null
      backgroundBlobId.value = setting.backgroundBlobId ?? null
      overlayOpacity.value = setting.overlayOpacity
      if (setting.backgroundBlobId) {
        const bg = await db.customBackgrounds.get(setting.backgroundBlobId)
        if (bg?.blob) {
          backgroundUrl.value = URL.createObjectURL(bg.blob)
        }
      }
    }
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', mode.value)
    document.documentElement.classList.toggle('dark', mode.value === 'dark')
  }

  async function toggleTheme() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
    applyTheme()
    await save()
  }

  async function setBackground(file: File) {
    const type = file.type.startsWith('video/') ? 'video'
      : file.type === 'image/gif' ? 'gif'
      : 'image'

    const id = `bg_${Date.now()}`
    await db.customBackgrounds.put({
      id,
      type: type as 'video' | 'gif' | 'image',
      blob: file,
      createdAt: new Date().toISOString(),
    })

    if (backgroundBlobId.value && backgroundBlobId.value !== id) {
      await db.customBackgrounds.delete(backgroundBlobId.value)
    }

    if (backgroundUrl.value) {
      URL.revokeObjectURL(backgroundUrl.value)
    }
    backgroundUrl.value = URL.createObjectURL(file)
    backgroundType.value = type
    backgroundBlobId.value = id
    await save()
  }

  async function clearBackground() {
    if (backgroundBlobId.value) {
      await db.customBackgrounds.delete(backgroundBlobId.value)
    }
    if (backgroundUrl.value) {
      URL.revokeObjectURL(backgroundUrl.value)
    }
    backgroundType.value = null
    backgroundBlobId.value = null
    backgroundUrl.value = null
    await save()
  }

  async function setOverlayOpacity(val: number) {
    overlayOpacity.value = val
    await save()
  }

  async function save() {
    await db.themeSettings.put({
      id: 'default',
      mode: mode.value,
      backgroundType: backgroundType.value,
      backgroundBlobId: backgroundBlobId.value,
      overlayOpacity: overlayOpacity.value,
    })
  }

  return {
    mode, backgroundType, backgroundBlobId, overlayOpacity, backgroundUrl,
    init, toggleTheme, setBackground, clearBackground, setOverlayOpacity,
  }
})
