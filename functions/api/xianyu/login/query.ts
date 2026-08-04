/**
 * 闲鱼扫码登录 — 轮询扫码状态
 *
 * GET /api/xianyu/login/query?lgToken=xxx&cookie=xxx
 * Response:
 *   - 未扫:    { success: true, status: 'new' }
 *   - 已扫待确认: { success: true, status: 'scanned' }
 *   - 确认登录:  { success: true, status: 'confirmed', cookie, returnUrl }
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface OnRequestArgs {
  request: Request
}

export const onRequestGet = async ({ request }: OnRequestArgs) => {
  try {
    const url = new URL(request.url)
    const lgToken = url.searchParams.get('lgToken')
    const cookie = url.searchParams.get('cookie') || ''

    if (!lgToken) {
      return Response.json({ success: false, error: '缺少 lgToken' }, { status: 400 })
    }

    const resp = await fetch(
      'https://passport.goofish.com/newlogin/qrcode/query.do?appName=taobao&fromSite=52&_bx-website=true',
      {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: 'https://www.goofish.com',
          Referer: 'https://www.goofish.com/',
          Cookie: cookie,
        },
        body: `lgToken=${encodeURIComponent(lgToken)}&appName=taobao&fromSite=52&_bx-website=true`,
      },
    )

    const data = await resp.json() as any
    const setCookie = extractSetCookie(resp.headers)
    const mergedCookie = mergeCookieStrs(cookie, setCookie)

    // content.code === 1: 新二维码
    // content.code === 2: 已扫码，待确认
    // content.code === 4: 确认登录成功
    const code = data?.content?.code

    if (data?.hasError) {
      return Response.json({
        success: false,
        error: data.content?.title || '查询失败',
        status: 'error',
      })
    }

    if (code === 4) {
      // 登录成功 —— 用 returnurl 换取完整登录态
      const returnUrl = data?.content?.returnUrl || ''
      let finalCookie = mergedCookie
      if (returnUrl) {
        finalCookie = await exchangeLoginToken(returnUrl, mergedCookie)
      }
      return Response.json({
        success: true,
        status: 'confirmed',
        cookie: finalCookie,
      })
    }

    if (code === 2) {
      return Response.json({ success: true, status: 'scanned', cookie: mergedCookie })
    }

    return Response.json({ success: true, status: 'new', cookie: mergedCookie })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}

/** 用 returnUrl 换取完整登录态 cookie */
async function exchangeLoginToken(returnUrl: string, cookie: string): Promise<string> {
  try {
    // returnUrl 是一个淘宝域名的跳转链接，访问它会设置 .goofish.com 的 cookie
    const resp = await fetch(returnUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: cookie,
      },
      redirect: 'manual',
    })
    const setCookie = extractSetCookie(resp.headers)
    let merged = mergeCookieStrs(cookie, setCookie)

    // 如果有 Location 重定向，继续跟几跳以收集所有 cookie
    let location = resp.headers.get('location')
    let hops = 0
    while (location && hops < 5) {
      const nextResp = await fetch(location, {
        headers: {
          'User-Agent': USER_AGENT,
          Cookie: merged,
        },
        redirect: 'manual',
      })
      const nextSetCookie = extractSetCookie(nextResp.headers)
      merged = mergeCookieStrs(merged, nextSetCookie)
      location = nextResp.headers.get('location')
      hops++
    }

    return merged
  } catch {
    return cookie
  }
}

/** 从响应头提取 Set-Cookie 合并为字符串 */
function extractSetCookie(headers: Headers): string {
  const setCookies = (headers as any).getSetCookie?.() as string[] | undefined
  if (setCookies && setCookies.length > 0) {
    return setCookies.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ')
  }
  const raw = headers.get('set-cookie')
  if (!raw) return ''
  return raw
    .split(/,(?=[^;]+?=)/)
    .map(c => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')
}

/** 合并两个 cookie 字符串（后者覆盖前者） */
function mergeCookieStrs(a: string, b: string): string {
  const map = new Map<string, string>()
  for (const part of [...a.split(';'), ...b.split(';')]) {
    const t = part.trim()
    if (!t || !t.includes('=')) continue
    const idx = t.indexOf('=')
    map.set(t.slice(0, idx).trim(), t.slice(idx + 1).trim())
  }
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}
