import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { LauncherItem } from '@/types/launcher'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const PRESET_APPS: Omit<LauncherItem, 'id' | 'order' | 'createdAt'>[] = [
  { name: 'VS Code', protocolUrl: 'vscode://', icon: '\u{1F4BB}', iconType: 'emoji' },
  { name: 'Steam', protocolUrl: 'steam://open/steam', icon: '\u{1F3AE}', iconType: 'emoji' },
  { name: 'WeChat', protocolUrl: 'weixin://', icon: '\u{1F4AC}', iconType: 'emoji' },
  { name: 'QQ', protocolUrl: 'tencent://', icon: '\u{1F427}', iconType: 'emoji' },
  { name: 'Chrome', protocolUrl: 'google-chrome://', icon: '\u{1F310}', iconType: 'emoji' },
  { name: '文件管理器', protocolUrl: 'file:///', icon: '\u{1F4C1}', iconType: 'emoji' },
]

export const useLauncherStore = defineStore('launcher', () => {
  const items = ref<LauncherItem[]>([])

  async function load() {
    items.value = await db.launcherItems.orderBy('order').toArray()
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
