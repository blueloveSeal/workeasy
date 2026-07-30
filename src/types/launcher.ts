export interface LauncherItem {
  id: string
  name: string
  protocolUrl: string
  icon?: string
  iconType?: 'image' | 'emoji' | 'letter'
  category?: string
  order: number
  createdAt: string
}
