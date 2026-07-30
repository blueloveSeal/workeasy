import Dexie, { type Table } from 'dexie'
import type { Task } from '@/types/task'
import type { Note } from '@/types/note'
import type { Bookmark } from '@/types/bookmark'
import type { LauncherItem } from '@/types/launcher'
import type { ThemeSetting, CustomBackground } from '@/types/theme'

export class WorkEasyDB extends Dexie {
  tasks!: Table<Task, string>
  notes!: Table<Note, string>
  bookmarks!: Table<Bookmark, string>
  launcherItems!: Table<LauncherItem, string>
  themeSettings!: Table<ThemeSetting, string>
  customBackgrounds!: Table<CustomBackground, string>

  constructor() {
    super('WorkEasyDB')
    // Version 2: Removed events table (calendar module deleted)
    this.version(2).stores({
      tasks: 'id, status, priority, dueDate, *tags, createdAt',
      notes: 'id, category, isPinned, *tags, updatedAt',
      bookmarks: 'id, category, *tags, createdAt',
      launcherItems: 'id, order',
      themeSettings: 'id',
      customBackgrounds: 'id, type',
    })
  }
}

export const db = new WorkEasyDB()
