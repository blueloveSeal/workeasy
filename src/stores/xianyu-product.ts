import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { XianyuProduct } from '@/types/xianyu'
import { xianyuApi } from '@/utils/xianyu-request'
import { useXianyuAuthStore } from './xianyu-auth'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useXianyuProductStore = defineStore('xianyu-product', () => {
  const products = ref<XianyuProduct[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      products.value = await db.xianyuProducts.orderBy('createdAt').reverse().toArray()
    } finally {
      loading.value = false
    }
  }

  async function add(product: Omit<XianyuProduct, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newProduct: XianyuProduct = {
      ...product,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    }
    await db.xianyuProducts.add(newProduct)
    products.value.unshift(newProduct)
    return newProduct
  }

  async function update(id: string, patch: Partial<XianyuProduct>) {
    const updates = { ...patch, updatedAt: new Date().toISOString() }
    await db.xianyuProducts.update(id, updates)
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) Object.assign(products.value[idx], updates)
  }

  async function remove(id: string) {
    await db.xianyuProducts.delete(id)
    products.value = products.value.filter(p => p.id !== id)
  }

  /** 上传商品图片到闲鱼 */
  async function uploadImage(file: File): Promise<{ url: string; id: string } | null> {
    const authStore = useXianyuAuthStore()
    if (!authStore.cookie?.cookie) return null

    const res = await xianyuApi.uploadImage(file, authStore.cookie.cookie)
    if (res?.updatedCookie) {
      await authStore.updateCookie(res.updatedCookie)
    }
    if (res?.imageUrl && res?.imageId) {
      return { url: res.imageUrl, id: res.imageId }
    }
    return null
  }

  /** 发布商品到闲鱼 */
  async function publishToXianyu(product: XianyuProduct): Promise<string | null> {
    const authStore = useXianyuAuthStore()
    if (!authStore.cookie?.cookie) return null

    const images = product.imageIds.map((id, i) => ({
      url: product.images[i] || '',
      id,
    }))

    const res = await xianyuApi.publish({
      cookie: authStore.cookie.cookie,
      title: product.title,
      description: product.description,
      price: product.price,
      images,
    })

    if (res?.updatedCookie) {
      await authStore.updateCookie(res.updatedCookie)
    }

    if (res?.itemId) {
      await update(product.id, {
        status: 'published',
        xianyuItemId: res.itemId,
      })
      return res.itemId
    }
    return null
  }

  return { products, loading, load, add, update, remove, uploadImage, publishToXianyu }
})
