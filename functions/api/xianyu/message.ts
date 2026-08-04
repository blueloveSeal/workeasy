/**
 * 闲鱼发送消息给买家（发货内容 / 卡密 / 网盘地址）
 *
 * POST /api/xianyu/message
 *   body: { cookie, toUserId, content, orderId? }
 *
 * mtop API: mtop.taobao.idle.message.pc.send (v1.0)
 * 用于在订单页面通过 IM 发送文本消息给买家
 */

import { mtopRequest } from './_lib/mtop'

interface MessageBody {
  cookie: string
  toUserId: string
  content: string
  orderId?: string
}

interface OnRequestArgs {
  request: Request
}

export const onRequestPost = async ({ request }: OnRequestArgs) => {
  try {
    const body = (await request.json()) as MessageBody
    const { cookie, toUserId, content, orderId } = body

    if (!cookie) {
      return Response.json({ success: false, error: '未登录，缺少 cookie' }, { status: 400 })
    }
    if (!toUserId || !content) {
      return Response.json({ success: false, error: '缺少接收人 ID 或消息内容' }, { status: 400 })
    }

    // 构造消息体 —— 闲鱼 IM 文本消息
    const messageContent = JSON.stringify({
      messageContent: content,
      messageType: 'text',
      orderId: orderId || '',
    })

    const result = await mtopRequest(
      'mtop.taobao.idle.message.pc.send',
      '1.0',
      {
        toUserId,
        messageContent,
        messageType: 'text',
        orderId: orderId || '',
      },
      cookie,
    )

    if (!result.success) {
      return Response.json({
        success: false,
        error: result.error || '发送消息失败',
        accountInvalid: result.accountInvalid,
      })
    }

    return Response.json({
      success: true,
      updatedCookie: result.updatedCookie,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}
