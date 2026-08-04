import { ElMessage } from 'element-plus'

const API_BASE = '/api/xianyu'

interface ApiResult<T = any> {
  success: boolean
  data?: T
  error?: string
  [key: string]: any
}

async function request<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST'
    body?: Record<string, any>
    params?: Record<string, string>
  } = {},
): Promise<T | null> {
  const { method = 'GET', body, params } = options

  let url = `${API_BASE}${path}`
  if (params) {
    const search = new URLSearchParams(params)
    url += `?${search.toString()}`
  }

  try {
    const resp = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const result: ApiResult<T> = await resp.json()

    if (!result.success) {
      ElMessage.error(result.error || '请求失败')
      return null
    }
    return result as unknown as T
  } catch (e: any) {
    ElMessage.error(e?.message || '网络请求异常')
    return null
  }
}

/** 上传文件（使用 formData） */
async function uploadFile(
  path: string,
  file: File,
  cookie: string,
): Promise<any | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('cookie', cookie)

  try {
    const resp = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: formData,
    })
    const result = await resp.json()
    if (!result.success) {
      ElMessage.error(result.error || '上传失败')
      return null
    }
    return result
  } catch (e: any) {
    ElMessage.error(e?.message || '上传异常')
    return null
  }
}

export const xianyuApi = {
  request,
  uploadFile,

  /** 生成登录二维码 */
  generateQrcode: () => request<{ qrCodeUrl: string; lgToken: string; cookie: string }>('/login/qrcode', { method: 'POST' }),

  /** 轮询扫码状态 */
  queryLogin: (lgToken: string, cookie: string) =>
    request<{ status: string; cookie?: string }>('/login/query', {
      params: { lgToken, cookie },
    }),

  /** 获取订单列表 */
  getOrders: (cookie: string, queryCode: string = 'NOT_SHIP', page: number = 1) =>
    request<{ orders: any[]; updatedCookie?: string; hasMore: boolean }>('/orders', {
      params: { cookie, queryCode, page: String(page) },
    }),

  /** 获取订单详情 */
  getOrderDetail: (orderId: string, cookie: string) =>
    request<{ detail: any; updatedCookie?: string }>(`/orders/${orderId}`, {
      params: { cookie },
    }),

  /** 发布商品 */
  publish: (data: {
    cookie: string
    title: string
    description: string
    price: number
    images: { url: string; id: string }[]
  }) => request<{ itemId: string; updatedCookie?: string }>('/publish', { method: 'POST', body: data }),

  /** 上传图片 */
  uploadImage: (file: File, cookie: string) => uploadFile('/upload', file, cookie),

  /** 确认发货 */
  deliver: (cookie: string, orderId: string) =>
    request<{ message: string; updatedCookie?: string }>('/deliver', {
      method: 'POST',
      body: { cookie, orderId },
    }),

  /** 发送消息给买家 */
  sendMessage: (cookie: string, toUserId: string, content: string, orderId?: string) =>
    request('/message', {
      method: 'POST',
      body: { cookie, toUserId, content, orderId },
    }),
}
