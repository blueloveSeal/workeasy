export interface XianyuCookie {
  id: string
  cookie: string
  token: string
  updatedAt: string
}

export interface XianyuProduct {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  imageIds: string[]
  category?: string
  deliveryType: 'manual' | 'auto'
  deliveryContent: string
  status: 'draft' | 'published' | 'offline'
  xianyuItemId?: string
  createdAt: string
  updatedAt: string
}

export interface XianyuOrder {
  orderId: string
  buyerNick: string
  buyerId: string
  itemId: string
  itemTitle: string
  itemImage?: string
  quantity: number
  totalFee: number
  status: 'wait_ship' | 'shipped' | 'finished' | 'closed' | 'unknown'
  statusText: string
  createTime: string
  paidTime?: string
  shipTime?: string
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string
  matchedProductId?: string
}
