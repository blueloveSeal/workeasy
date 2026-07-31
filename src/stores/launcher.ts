import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { LauncherItem } from '@/types/launcher'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 保证首次加载时自动添加的保底应用 */
export const DEFAULT_APPS: Omit<LauncherItem, 'id' | 'order' | 'createdAt'>[] = [
  { name: 'WeChat', protocolUrl: 'weixin://', icon: '\u{1F4AC}', iconType: 'emoji' },
]

/** "添加预设" 按钮可添加的全部应用 */
export const PRESET_APPS: Omit<LauncherItem, 'id' | 'order' | 'createdAt'>[] = [
  { name: 'WeChat', protocolUrl: 'weixin://', icon: '\u{1F4AC}', iconType: 'emoji' },
  { name: 'Chrome', protocolUrl: 'google-chrome://', icon: '\u{1F310}', iconType: 'emoji' },
  { name: 'Teams', protocolUrl: 'msteams://', icon: '\u{1F4DE}', iconType: 'emoji' },
  { name: 'Clash Verge', protocolUrl: 'clash://', icon: '\u{1F6E1}', iconType: 'emoji' },
  { name: 'ChatGPT', protocolUrl: 'chatgpt://', icon: '\u{1F916}', iconType: 'emoji' },
  { name: 'Qoder', protocolUrl: 'https://qoder.com', icon: '\u{1F680}', iconType: 'emoji' },
]

export const useLauncherStore = defineStore('launcher', () => {
  const items = ref<LauncherItem[]>([])

  async function load() {
    items.value = await db.launcherItems.orderBy('order').toArray()
    // 首次使用：自动添加保底应用（WeChat）
    if (items.value.length === 0) {
      for (const app of DEFAULT_APPS) {
        await add(app)
      }
    }
  }

  async function add(item: Omit<LauncherItem, 'id' | 'order' | 'createdAt'>) {
    const maxOrder = items.value.reduce((max, i) => Math.max(max, i.order), 0)
    const newItem: LauncherItem = {
      ...item,
      id: genId(),
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    }
    await db.launcherItems.add(newItem)
    items.value.push(newItem)
    return newItem
  }

  async function update(id: string, patch: Partial<LauncherItem>) {
    await db.launcherItems.update(id, patch)
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) Object.assign(items.value[idx], patch)
  }

  async function remove(id: string) {
    await db.launcherItems.delete(id)
    items.value = items.value.filter(i => i.id !== id)
  }

  async function reorder(ids: string[]) {
    for (let i = 0; i < ids.length; i++) {
      await db.launcherItems.update(ids[i], { order: i })
    }
    await load()
  }

  async function addPresets() {
    const existing = new Set(items.value.map(i => i.name))
    const maxOrder = items.value.reduce((max, i) => Math.max(max, i.order), 0)
    let order = maxOrder + 1
    for (const preset of PRESET_APPS) {
      if (!existing.has(preset.name)) {
        const newItem: LauncherItem = {
          ...preset,
          id: genId(),
          order: order++,
          createdAt: new Date().toISOString(),
        }
        await db.launcherItems.add(newItem)
        items.value.push(newItem)
      }
    }
  }

  return { items, load, add, update, remove, reorder, addPresets }
})
