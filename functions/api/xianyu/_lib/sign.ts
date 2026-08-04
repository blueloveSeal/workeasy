/**
 * 闲鱼 mtop 签名算法
 *
 * 参考: cv-cat/XianYuApis、zhinianboke/xianyu-auto-reply
 * 签名公式: md5(token & t & appKey & data)
 *   - token: 从 Cookie 的 _m_h5_tk 字段取第一段（以 _ 分割）
 *   - t: 毫秒时间戳
 *   - appKey: 固定 "34839810"
 *   - data: 紧凑 JSON 字符串
 */

export const APP_KEY = '34839810'
export const BASE_URL = 'https://h5api.m.goofish.com/h5'

/** 令牌过期 / 缺失标志 —— 命中后需合并 Set-Cookie 并重试 */
export const TOKEN_EXPIRED_MARKERS = [
  'FAIL_SYS_TOKEN_EXOIRED',
  'FAIL_SYS_TOKEN_EXPIRED',
  'FAIL_SYS_TOKEN_EMPTY',
  '令牌过期',
  '令牌为空',
]

/** 风控 / 验证标志 —— 命中说明账号被限制 */
export const VALIDATE_MARKERS = [
  'FAIL_SYS_USER_VALIDATE',
  'RGV587',
  'FAIL_SYS_ILLEGAL_ACCESS',
  'FAIL_BIZ_WUA_IS_MACHINE',
  'WUA_IS_MACHINE',
  '哎哟喂',
  'punish',
  'captcha',
  'validate',
]

/** 将 cookie 字符串解析为 Map */
export function parseCookies(cookieStr: string): Map<string, string> {
  const cookies = new Map<string, string>()
  for (const part of cookieStr.split(';')) {
    const trimmed = part.trim()
    if (!trimmed || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (key) cookies.set(key, value)
  }
  return cookies
}

/** 从 cookie 字符串中提取 _m_h5_tk 的 token 段 */
export function extractToken(cookieStr: string): string {
  const cookies = parseCookies(cookieStr)
  const h5tk = cookies.get('_m_h5_tk') || ''
  return h5tk.split('_')[0] || ''
}

/** 从 cookie 字符串中提取用户 ID（unb 或 munb） */
export function extractUserId(cookieStr: string): string {
  const cookies = parseCookies(cookieStr)
  return (cookies.get('unb') || cookies.get('munb') || '').trim()
}

/** 将 ArrayBuffer 转为十六进制字符串 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 生成 mtop 签名
 * Cloudflare Workers / Node 18+ 的 crypto.subtle 支持 MD5
 */
export async function generateSign(t: string, token: string, data: string): Promise<string> {
  const msg = `${token}&${t}&${APP_KEY}&${data}`
  const hashBuffer = await crypto.subtle.digest('MD5', new TextEncoder().encode(msg))
  return bufferToHex(hashBuffer)
}
