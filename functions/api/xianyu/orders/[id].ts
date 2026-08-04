/**
 * 闲鱼订单详情
 *
 * GET /api/xianyu/orders/:id?cookie=xxx
 *
 * mtop API: mtop.idle.web.trade.order.detail (v1.0)
 */

import { mtopRequest } from '../_lib/mtop'

interface OnRequestArgs {
  request: Request
  params: { id: string }
}

export const onRequestGet = async ({ request, params }: OnRequestArgs) => {
  try {
    const url = new URL(request.url)
    const cookie = url.searchParams.get('cookie') || ''
    const orderId = params.id

    if (!cookie) {
      return Response.json({ success: false, error: '未登录，缺少 cookie' }, { status: 400 })
    }
    if (!orderId) {
      return Response.json({ success: false, error: '缺少订单 ID' }, { status: 400 })
    }

    const result = await mtopRequest(
      'mtop.idle.web.trade.order.detail',
      '1.0',
      { tid: orderId },
      cookie,
    )

    if (!result.success) {
      return Response.json({
        success: false,
        error: result.error,
        accountInvalid: result.accountInvalid,
      })
    }

    // 解析订单详情 —— 数据在 components 数组中，按 render 类型提取
    const components = result.data?.components || []
    const detail: Record<string, any> = { orderId }

    for (const comp of components) {
      const render = comp.render
      const model = comp.model || comp.data || {}

      if (render === 'orderInfoVO') {
        const itemInfo = model.itemInfo || {}
        detail.quantity = itemInfo.buyAmount || 1
        detail.amount = parseFloat(itemInfo.price || '0')
        detail.skuInfo = itemInfo.skuInfo || ''
        detail.itemTitle = itemInfo.title || ''
        detail.itemId = itemInfo.itemId || ''
        detail.itemImage = itemInfo.pic || ''
        // 从 orderInfoList 提取时间信息
        const orderInfoList = model.orderInfoList || []
        for (const info of orderInfoList) {
          if (info.label?.includes('时间')) {
            detail.placedAtStr = info.value || ''
          }
        }
      } else if (render === 'addressInfoVO') {
        detail.receiverName = model.name || ''
        detail.receiverPhone = model.phoneNumber || ''
        detail.receiverAddress = model.address || ''
      } else if (render === 'orderStatusVO') {
        const nodes = model.orderStatusNodeList || []
        detail.statusNodes = nodes.map((n: any) => ({ title: n.title, completed: n.completed }))
      }
    }

    return Response.json({
      success: true,
      detail,
      updatedCookie: result.updatedCookie,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}
