/**
 * 闲鱼 mtop 通用请求模块
 *
 * 参考: zhinianboke/xianyu-auto-reply 的 common/services/xianyu_mtop.py
 * 负责: 构造 mtop 请求 URL/参数/body、签名、token 过期重试、Set-Cookie 合并
 */

import {
  APP_KEY,
  BASE_URL,
  TOKEN_EXPIRED_MARKERS,
  VALIDATE_MARKERS,
  extractToken,
  parseCookies,
  generateSign,
} from './sign'

const MAX_ATTEMPTS = 3
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface MtopResult {
  success: boolean
  data: any
  ret: string[]
  /** token 刷新后的新 cookie（如果中途刷新过） */
  updatedCookie?: string
  /** 账号是否失效（风控/session 过期） */
  accountInvalid: boolean
  error?: string
}

/**
 * 发起一次 mtop 请求（带 token 过期重试）
 *
 * @param api       mtop API 名称，如 mtop.taobao.idle.trade.merchant.sold.get
 * @param version   API 版本，如 1.0
 * @param data      请求 data 对象（会被紧凑 JSON 序列化）
 * @param cookie    完整 cookie 字符串
 * @param extraParams 额外的 query 参数
 */
export async function mtopRequest(
  api: string,
  version: string,
  data: Record<string, any>,
  cookie: string,
  extraParams?: Record<string, string>,
): Promise<MtopResult> {
  let currentCookie = cookie
  let tokenRefreshed = false

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const t = String(Date.now())
    const token = extractToken(currentCookie)
    const dataStr = JSON.stringify(data)
    const sign = await generateSign(t, token, dataStr)

    const url = new URL(`${BASE_URL}/${api}/${version}/`)
    url.searchParams.set('jsv', '2.7.2')
    url.searchParams.set('appKey', APP_KEY)
    url.searchParams.set('t', t)
    url.searchParams.set('sign', sign)
    url.searchParams.set('v', version)
    url.searchParams.set('type', 'originaljson')
    url.searchParams.set('accountSite', 'xianyu')
    url.searchParams.set('dataType', 'json')
    url.searchParams.set('timeout', '20000')
    url.searchParams.set('api', api)
    url.searchParams.set('sessionOption', 'AutoLoginOnly')
    url.searchParams.set('spm_cnt', 'a21ybx.item.0.0')
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        url.searchParams.set(k, v)
      }
    }

    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://www.goofish.com',
        Referer: 'https://www.goofish.com/',
        'User-Agent': USER_AGENT,
        Cookie: currentCookie,
      },
      body: `data=${encodeURIComponent(dataStr)}`,
    })

    const respText = await resp.text()
    let respJson: any
    try {
      respJson = JSON.parse(respText)
    } catch {
      return {
        success: false,
        data: null,
        ret: [],
        accountInvalid: false,
        error: `响应解析失败: ${respText.slice(0, 200)}`,
      }
    }

    const ret: string[] = respJson.ret || []
    const retMsg = ret[0] || ''

    // 成功
    if (retMsg.includes('SUCCESS::')) {
      return {
        success: true,
        data: respJson.data,
        ret,
        updatedCookie: tokenRefreshed ? currentCookie : undefined,
        accountInvalid: false,
      }
    }

    // 检查 token 过期 —— 合并 Set-Cookie 后重试
    if (TOKEN_EXPIRED_MARKERS.some(m => retMsg.includes(m))) {
      const setCookie = extractSetCookie(resp.headers)
      if (setCookie) {
        currentCookie = mergeCookies(currentCookie, setCookie)
        tokenRefreshed = true
        await sleep(300)
        continue
      }
      // 无 Set-Cookie 也重试一次
      await sleep(300)
      continue
    }

    // 检查风控 / 验证
    if (VALIDATE_MARKERS.some(m => retMsg.includes(m))) {
      return {
        success: false,
        data: respJson.data,
        ret,
        accountInvalid: true,
        error: `账号被风控: ${retMsg}`,
      }
    }

    // 其他错误
    return {
      success: false,
      data: respJson.data,
      ret,
      accountInvalid: false,
      error: retMsg || '调用失败',
    }
  }

  return {
    success: false,
    data: null,
    ret: [],
    accountInvalid: false,
    error: '调用失败，重试次数过多（token 过期）',
  }
}

/** 从响应头提取 Set-Cookie 合并为字符串 */
function extractSetCookie(headers: Headers): string {
  // fetch API 在 Workers 中 getSetCookie() 可拿到数组
  const setCookies = (headers as any).getSetCookie?.() as string[] | undefined
  if (setCookies && setCookies.length > 0) {
    return setCookies.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ')
  }
  // 兜底：手动读 header
  const raw = headers.get('set-cookie')
  if (!raw) return ''
  return raw
    .split(/,(?=[^;]+?=)/)
    .map(c => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')
}

/** 将 setCookie 合并到 currentCookie（后者覆盖前者） */
function mergeCookies(currentCookie: string, setCookie: string): string {
  const base = parseCookies(setCookie)
  const overlay = parseCookies(currentCookie)
  for (const [k, v] of overlay) {
    base.set(k, v)
  }
  return Array.from(base.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
