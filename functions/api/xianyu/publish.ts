/**
 * 闲鱼发布商品
 *
 * POST /api/xianyu/publish
 *   body: { cookie, title, description, price, images: [{url, id}], categoryId?, location? }
 *
 * 流程: 类目推荐（可选） → 默认地址（可选） → 发布商品
 * mtop API: mtop.idle.pc.idleitem.publish (v1.0)
 */

import { mtopRequest } from './_lib/mtop'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface PublishBody {
  cookie: string
  title: string
  description: string
  price: number
  images: { url: string; id: string }[]
  categoryId?: string
  categoryTitle?: string
  longitude?: string
  latitude?: string
  address?: string
}

interface OnRequestArgs {
  request: Request
}

export const onRequestPost = async ({ request }: OnRequestArgs) => {
  try {
    const body = (await request.json()) as PublishBody
    const { cookie, title, description, price, images } = body

    if (!cookie) {
      return Response.json({ success: false, error: '未登录，缺少 cookie' }, { status: 400 })
    }
    if (!title || !price || !images || images.length === 0) {
      return Response.json({ success: false, error: '缺少标题、价格或图片' }, { status: 400 })
    }

    // 步骤 1: 类目推荐（可选，用于获取 categoryId）
    let categoryId = body.categoryId || ''
    if (!categoryId) {
      const catResult = await mtopRequest(
        'mtop.taobao.idle.kgraph.property.recommend',
        '2.0',
        {
          title,
          description,
          imageInfos: images.map(img => ({ url: img.url })),
          uniqueCode: Date.now().toString(),
        },
        cookie,
      )
      if (catResult.success && catResult.data) {
        // 从推荐结果提取类目 ID
        const catData = catResult.data
        categoryId = catData?.categoryId || catData?.catId || catData?.data?.categoryId || ''
      }
    }

    // 步骤 2: 获取默认地址（可选）
    let longitude = body.longitude || '116.397428'
    let latitude = body.latitude || '39.90923'
    let address = body.address || ''
    if (!body.longitude) {
      const locResult = await mtopRequest(
        'mtop.taobao.idle.local.poi.get',
        '1.0',
        { longitude: '116.397428', latitude: '39.90923' },
        cookie,
      )
      if (locResult.success && locResult.data) {
        const poi = locResult.data
        longitude = poi.longitude || longitude
        latitude = poi.latitude || latitude
        address = poi.address || poi.name || ''
      }
    }

    // 步骤 3: 发布商品
    const imageInfoDOList = images.map(img => ({
      url: img.url,
      picId: img.id,
    }))

    const publishData = {
      imageInfoDOList,
      itemTextDTO: {
        title,
        description,
      },
      itemPriceDTO: {
        price: String(price),
        originPrice: String(price),
      },
      itemPostFeeDTO: {
        postMode: 1, // 包邮
        postFee: '0',
      },
      itemAddrDTO: {
        longitude,
        latitude,
        address: address || '北京市',
        city: '北京市',
        province: '北京市',
      },
      itemCatDTO: categoryId
        ? { categoryId, categoryTitle: body.categoryTitle || '' }
        : undefined,
      // 虚拟商品发货设置
      deliveryConfig: {
        deliverMode: 2, // 虚拟发货
      },
    }

    const result = await mtopRequest(
      'mtop.idle.pc.idleitem.publish',
      '1.0',
      publishData,
      cookie,
    )

    if (!result.success) {
      return Response.json({
        success: false,
        error: result.error,
        accountInvalid: result.accountInvalid,
      })
    }

    // 解析发布结果，提取商品 ID
    const itemId = result.data?.itemId || result.data?.data?.itemId || ''

    return Response.json({
      success: true,
      itemId,
      updatedCookie: result.updatedCookie,
    })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || '请求异常' }, { status: 500 })
  }
}

export { USER_AGENT }
