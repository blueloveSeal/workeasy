/**
 * 闲鱼确认发货（虚拟商品 / 无物流）
 *
 * POST /api/xianyu/deliver
 *   body: { cookie, orderId }
 *
 * mtop API: mtop.taobao.idle.logistic.consign.dummy (v1.0)
 * 成功判定: ret 包含 SUCCESS::调用成功 / ORDER_ALREADY_DELIVERY / 已发货成功
 */

import { mtopRequest } from './_lib/mtop'

interface DeliverBody {
  cookie: string
  orderId: string
}

interface OnRequestArgs {
  request: Request
}

export const onRequestPost = async ({ request }: OnRequestArgs) => {
  try {
    const body = (await request.json()) as DeliverBody
    const { cookie, orderId } = body

    if (!cookie) {
      return Response.json({ success: false, error: '未登录，缺少 cookie' }, { status: 400 })
    }
    if (!orderId) {
      return Response.json({ success: false, error: '缺少订单 ID' }, { status: 400 })
    }

    const result = await mtopRequest(
      'mtop.taobao.idle.logistic.consign.dummy',
      '1.0',
      {
        orderId,
        tradeText: '',
        picList: [],
        newUnconsign: true,
      },
      cookie,
    )

    const retMsg = result.ret[0] || ''

    // 成功判定
    const isDelivered =
      result.success ||
      retMsg.includes('ORDER_ALREADY_DELIVERY') ||
      retMsg.includes('已发货成功')

    if (isDelivered) {
      return Response.json({
        success: true,
        message: retMsg.includes('ORDER_ALREADY_DELIVERY') ? '订单已发货过' : '发货成功',
        updatedCookie: result.updatedCookie,
      })
    }

    return Response.json({
      success: false,
      error: result.error || retMsg || '发货失败',
      accountInvalid: result.accountInvalid,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}
