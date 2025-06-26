import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256')

    if (!hmacHeader || !verifyWebhook(body, hmacHeader)) {
      return NextResponse.json(
        { error: 'Webhook验证失败' },
        { status: 401 }
      )
    }

    const data = JSON.parse(body)
    const shop = data.domain

    if (!shop) {
      return NextResponse.json(
        { error: '缺少商店信息' },
        { status: 400 }
      )
    }

    // TODO: 实现数据清理逻辑
    console.log(`应用已从商店 ${shop} 卸载`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('处理卸载webhook失败:', error)
    return NextResponse.json(
      { error: '处理失败' },
      { status: 500 }
    )
  }
} 