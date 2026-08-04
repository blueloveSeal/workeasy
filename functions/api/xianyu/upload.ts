/**
 * 闲鱼上传商品图片
 *
 * POST /api/xianyu/upload
 *   formData: { file: File, cookie: string }
 *
 * 上传到: https://stream-upload.goofish.com/api/upload.api
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface OnRequestArgs {
  request: Request
}

export const onRequestPost = async ({ request }: OnRequestArgs) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const cookie = formData.get('cookie') as string | null

    if (!file) {
      return Response.json({ success: false, error: '缺少图片文件' }, { status: 400 })
    }
    if (!cookie) {
      return Response.json({ success: false, error: '未登录，缺少 cookie' }, { status: 400 })
    }

    // 转发到闲鱼图片上传接口
    const uploadForm = new FormData()
    uploadForm.append('file', file, file.name)
    uploadForm.append('name', file.name)

    const resp = await fetch(
      'https://stream-upload.goofish.com/api/upload.api?appkey=xy_chat&tp=3002&dc=0&ol=0&_bx-website=true',
      {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          Origin: 'https://www.goofish.com',
          Referer: 'https://www.goofish.com/',
          Cookie: cookie,
        },
        body: uploadForm,
      },
    )

    const data = await resp.json() as any

    if (data?.header?.ret !== 'SUCCESS' && data?.header?.ret?.[0] !== 'SUCCESS') {
      return Response.json({
        success: false,
        error: data?.header?.ret?.[0] || data?.header?.ret || '上传失败',
      })
    }

    // 解析图片 URL
    const imageUrl = data?.data?.url || data?.url || ''
    const imageId = data?.data?.imageId || data?.data?.picId || ''

    return Response.json({
      success: true,
      imageUrl,
      imageId,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}
