/**
 * 闲鱼扫码登录 — 生成二维码
 *
 * 参考: 阿里 passport 二维码登录流程
 * POST /api/xianyu/login/qrcode
 * Response: { success, qrCodeUrl, lgToken }
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface OnRequestArgs {
  request: Request
}

export const onRequestPost = async ({ request }: OnRequestArgs) => {
  try {
    // 先访问首页获取 cna cookie
    const homeResp = await fetch('https://www.goofish.com/', {
      headers: { 'User-Agent': USER_AGENT },
    })
    const cnaCookie = extractSetCookie(homeResp.headers)

    // 生成二维码
    const resp = await fetch(
      'https://passport.goofish.com/newlogin/qrcode/generate.do?appName=taobao&fromSite=52&_bx-website=true&bx-ua=xd&&bx-bsToken=&smDeviceId=&appEntrance=taobao_pc&umToken=&isSecVerison=0',
      {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: 'https://www.goofish.com',
          Referer: 'https://www.goofish.com/',
          Cookie: cnaCookie,
        },
        body: 'appName=taobao&fromSite=52',
      },
    )

    const data = await resp.json() as any
    const setCookie = extractSetCookie(resp.headers)

    if (data?.hasError) {
      return Response.json({ success: false, error: data.content?.title || '生成二维码失败' }, { status: 200 })
    }

    // 合并 cna + 本次返回的 cookie
    const cookie = mergeCookieStrs(cnaCookie, setCookie)

    return Response.json({
      success: true,
      qrCodeUrl: data?.content?.codeContent || '',
      lgToken: data?.content?.lgToken || '',
      cookie,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
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
