import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { db } from '@/db'
import type { XianyuOrder } from '@/types/xianyu'
import { xianyuApi } from '@/utils/xianyu-request'
import { useXianyuAuthStore } from './xianyu-auth'
import { useXianyuProductStore } from './xianyu-product'

export const useXianyuOrderStore = defineStore('xianyu-order', () => {
  const orders = ref<XianyuOrder[]>([])
  const loading = ref(false)
  const autoDeliverTimer = ref<number | null>(null)
  const autoDeliverEnabled = ref(false)

  async function load() {
    loading.value = true
    try {
      orders.value = await db.xianyuOrders.orderBy('createTime').reverse().toArray()
    } finally {
      loading.value = false
    }
  }

  /** 保存订单到本地缓存 */
  async function saveOrders(newOrders: XianyuOrder[]) {
    await db.xianyuOrders.bulkPut(newOrders)
  }

  /** 从闲鱼拉取订单列表 */
  async function refreshOrders(queryCode: string = 'NOT_SHIP') {
    const authStore = useXianyuAuthStore()
    if (!authStore.cookie?.cookie) return []

    loading.value = true
    try {
      const res = await xianyuApi.getOrders(authStore.cookie.cookie, queryCode)
      if (res?.updatedCookie) {
        await authStore.updateCookie(res.updatedCookie)
      }

      if (res?.orders) {
        const mapped: XianyuOrder[] = res.orders.map((o: any) => ({
          orderId: o.orderId,
          buyerNick: o.buyerNick || '',
          buyerId: o.buyerId || '',
          itemId: o.itemId || '',
          itemTitle: o.itemTitle || '',
          itemImage: o.itemImage,
          quantity: o.quantity || 1,
          totalFee: o.totalFee || 0,
          status: mapOrderStatus(o.status),
          statusText: o.statusText || '',
          createTime: o.createTime || '',
          paidTime: o.paidTime,
          shipTime: o.shipTime,
          receiverName: o.receiverName,
          receiverPhone: o.receiverPhone,
          receiverAddress: o.receiverAddress,
        }))

        await saveOrders(mapped)
        await load()
        return mapped
      }
      return []
    } finally {
      loading.value = false
    }
  }

  /** 映射闲鱼订单状态 */
  function mapOrderStatus(status: string): XianyuOrder['status'] {
    const map: Record<string, XianyuOrder['status']> = {
      wait_ship: 'wait_ship',
      NOT_SHIP: 'wait_ship',
      shipped: 'shipped',
      SHIPED: 'shipped',
      finished: 'finished',
      FINISHED: 'finished',
      closed: 'closed',
      CLOSED: 'closed',
    }
    return map[status] || 'unknown'
  }

  /** 匹配本地商品（根据 itemId） */
  function matchProduct(order: XianyuOrder): XianyuOrder {
    const productStore = useXianyuProductStore()
    const matched = productStore.products.find(p => p.xianyuItemId === order.itemId)
    if (matched) {
      return { ...order, matchedProductId: matched.id }
    }
    return order
  }

  /** 手动确认发货 */
  async function deliverOrder(orderId: string): Promise<boolean> {
    const authStore = useXianyuAuthStore()
    if (!authStore.cookie?.cookie) return false

    const res = await xianyuApi.deliver(authStore.cookie.cookie, orderId)
    if (res?.updatedCookie) {
      await authStore.updateCookie(res.updatedCookie)
    }

    if (res) {
      await db.xianyuOrders.update(orderId, {
        status: 'shipped',
        shipTime: new Date().toISOString(),
      })
      await load()
      return true
    }
    return false
  }

  /** 发送消息给买家 */
  async function sendBuyerMessage(toUserId: string, content: string, orderId?: string): Promise<boolean> {
    const authStore = useXianyuAuthStore()
    if (!authStore.cookie?.cookie) return false

    const res = await xianyuApi.sendMessage(authStore.cookie.cookie, toUserId, content, orderId)
    if (res) return true
    return false
  }

  /** 自动发货单个订单 */
  async function autoDeliverOrder(order: XianyuOrder): Promise<boolean> {
    // 匹配本地商品
    const matched = matchProduct(order)
    if (!matched.matchedProductId) return false

    const productStore = useXianyuProductStore()
    const product = productStore.products.find(p => p.id === matched.matchedProductId)
    if (!product || product.deliveryType !== 'auto' || !product.deliveryContent) return false

    // 发送卡密消息
    const sent = await sendBuyerMessage(order.buyerId, product.deliveryContent, order.orderId)
    if (!sent) return false

    // 确认发货
    const delivered = await deliverOrder(order.orderId)
    if (!delivered) return false

    ElNotification({
      title: '自动发货成功',
      message: `订单 ${order.orderId} 已自动发货`,
      type: 'success',
    })

    return true
  }

  /** 执行一轮自动发货 */
  async function runAutoDeliver() {
    const authStore = useXianyuAuthStore()
    if (!authStore.isLoggedIn) return

    const freshOrders = await refreshOrders('NOT_SHIP')
    const waitShipOrders = freshOrders.filter(o => o.status === 'wait_ship')

    for (const order of waitShipOrders) {
      await autoDeliverOrder(order)
    }
  }

  /** 启动自动发货轮询 */
  function startAutoDeliver(intervalMinutes: number = 1) {
    if (autoDeliverTimer.value) return
    autoDeliverEnabled.value = true

    // 立即执行一次
    runAutoDeliver()

    // 设置定时器
    autoDeliverTimer.value = window.setInterval(() => {
      runAutoDeliver()
    }, intervalMinutes * 60 * 1000)
  }

  /** 停止自动发货轮询 */
  function stopAutoDeliver() {
    if (autoDeliverTimer.value) {
      clearInterval(autoDeliverTimer.value)
      autoDeliverTimer.value = null
    }
    autoDeliverEnabled.value = false
  }

  return {
    orders,
    loading,
    autoDeliverEnabled,
    load,
    refreshOrders,
    deliverOrder,
    sendBuyerMessage,
    autoDeliverOrder,
    runAutoDeliver,
    startAutoDeliver,
    stopAutoDeliver,
  }
})
