/**
 * 闲鱼订单列表
 *
 * GET /api/xianyu/orders?cookie=xxx&page=1&queryCode=NOT_SHIP
 *   - queryCode: ALL | NOT_SHIP（待发货）
 *
 * mtop API: mtop.taobao.idle.trade.merchant.sold.get (v1.0)
 */

import { mtopRequest } from '../_lib/mtop'

interface OnRequestArgs {
  request: Request
}

export const onRequestGet = async ({ request }: OnRequestArgs) => {
  try {
    const url = new URL(request.url)
    const cookie = url.searchParams.get('cookie') || ''
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const queryCode = url.searchParams.get('queryCode') || 'NOT_SHIP'
    const rowsPerPage = parseInt(url.searchParams.get('rowsPerPage') || '30', 10)

    if (!cookie) {
      return Response.json({ success: false, error: '未登录，缺少 cookie' }, { status: 400 })
    }

    const result = await mtopRequest(
      'mtop.taobao.idle.trade.merchant.sold.get',
      '1.0',
      {
        pageNumber: page,
        rowsPerPage,
        orderIds: '',
        queryCode,
        orderSearchParam: '{}',
      },
      cookie,
    )

    if (!result.success) {
      return Response.json({
        success: false,
        error: result.error,
        accountInvalid: result.accountInvalid,
      })
    }

    // 解析订单列表
    const rawItems = result.data?.data?.items || result.data?.items || []
    const orders = (rawItems as any[]).map(parseSoldOrderItem).filter(Boolean)

    return Response.json({
      success: true,
      orders,
      updatedCookie: result.updatedCookie,
      hasMore: orders.length >= rowsPerPage,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}

/** 解析已卖订单列表中的单条订单 */
function parseSoldOrderItem(item: any) {
  if (!item) return null
  const common = item.commonData || {}
  const buyer = item.buyerInfoVO || {}
  const price = item.priceVO || {}

  return {
    orderId: common.order_no || '',
    status: mapOrderStatus(common.status),
    statusText: common.status || '',
    itemId: common.item_id || '',
    itemTitle: common.title || item.itemTitle || '',
    itemImage: common.pic || '',
    buyerNick: buyer.userNick || buyer.nick || '',
    buyerId: buyer.buyer_id || '',
    quantity: price.buyNum || 1,
    totalFee: parseFloat(price.amount || '0'),
    createTime: common.placed_at || '',
    receiverName: buyer.name || '',
    receiverPhone: buyer.phone || '',
    receiverAddress: buyer.address || '',
  }
}

/** 闲鱼中文状态映射为内部状态 */
function mapOrderStatus(statusText: string): string {
  if (!statusText) return 'unknown'
  if (statusText.includes('待发货') || statusText.includes('付款')) return 'wait_ship'
  if (statusText.includes('已发货') || statusText.includes('确认收货')) return 'shipped'
  if (statusText.includes('完成') || statusText.includes('成功')) return 'finished'
  if (statusText.includes('关闭') || statusText.includes('取消')) return 'closed'
  return 'unknown'
}
