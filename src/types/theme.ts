export type ThemeMode = 'light' | 'dark'

export interface ThemeSetting {
  id: string
  mode: ThemeMode
  backgroundType?: 'video' | 'gif' | 'image' | 'color' | null
  backgroundBlobId?: string | null
  overlayOpacity: number
}

export interface CustomBackground {
  id: string
  type: 'video' | 'gif' | 'image'
  blob: Blob
  url?: string
  createdAt: string
}
