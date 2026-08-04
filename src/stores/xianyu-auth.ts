import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { XianyuCookie } from '@/types/xianyu'
import { xianyuApi } from '@/utils/xianyu-request'

export const useXianyuAuthStore = defineStore('xianyu-auth', () => {
  const cookie = ref<XianyuCookie | null>(null)
  const qrcodeUrl = ref('')
  const lgToken = ref('')
  const polling = ref(false)

  const isLoggedIn = computed(() => !!cookie.value?.cookie)
  const token = computed(() => cookie.value?.token || '')

  async function load() {
    const stored = await db.xianyuCookie.get('default')
    if (stored) {
      cookie.value = stored
    }
  }

  async function saveCookie(cookieStr: string, tokenStr: string) {
    const entry: XianyuCookie = {
      id: 'default',
      cookie: cookieStr,
      token: tokenStr,
      updatedAt: new Date().toISOString(),
    }
    await db.xianyuCookie.put(entry)
    cookie.value = entry
  }

  /** 从 cookie 字符串中提取 _m_h5_tk 的 token 部分 */
  function extractToken(cookieStr: string): string {
    const match = cookieStr.match(/_m_h5_tk=([^;]+)/)
    if (match) {
      return match[1].split('_')[0]
    }
    return ''
  }

  /** 生成登录二维码 */
  async function generateQrcode() {
    const res = await xianyuApi.generateQrcode()
    if (res) {
      qrcodeUrl.value = res.qrCodeUrl
      lgToken.value = res.lgToken
      // 保存初始 cookie
      if (res.cookie) {
        await saveCookie(res.cookie, extractToken(res.cookie))
      }
    }
    return res
  }

  /** 轮询扫码状态 */
  async function queryLoginStatus(): Promise<{ success: boolean; logged: boolean }> {
    if (!lgToken.value || !cookie.value?.cookie) {
      return { success: false, logged: false }
    }

    const res = await xianyuApi.queryLogin(lgToken.value, cookie.value.cookie)
    if (!res) return { success: false, logged: false }

    if (res.status === 'confirmed' && res.cookie) {
      // 登录成功，保存完整 cookie
      const fullCookie = res.cookie
      const token = extractToken(fullCookie)
      await saveCookie(fullCookie, token)
      qrcodeUrl.value = ''
      lgToken.value = ''
      return { success: true, logged: true }
    }

    return { success: true, logged: false }
  }

  /** 更新 cookie（例如 token 刷新后） */
  async function updateCookie(newCookie: string) {
    const token = extractToken(newCookie)
    await saveCookie(newCookie, token)
  }

  async function logout() {
    await db.xianyuCookie.delete('default')
    cookie.value = null
    qrcodeUrl.value = ''
    lgToken.value = ''
  }

  return {
    cookie,
    qrcodeUrl,
    lgToken,
    polling,
    isLoggedIn,
    token,
    load,
    generateQrcode,
    queryLoginStatus,
    updateCookie,
    logout,
  }
})
