export interface Note {
  id: string
  title: string
  content: string
  category?: string
  tags: string[]
  isPinned: boolean
  createdAt: string
  updatedAt: string
}
