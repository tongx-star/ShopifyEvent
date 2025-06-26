import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, ConversionEvent, EventStats } from '@/lib/types'
import { Storage } from '@/lib/storage'

// 获取事件列表
export async function GET(request: NextRequest) {
  try {
    const shop = getShopFromRequest(request)
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '无效的商店信息'
      } as ApiResponse, { status: 400 })
    }

    // 从存储中获取事件列表
    const events = await Storage.getEvents(shop, 100) // 获取最近100条事件
    
    return NextResponse.json({
      success: true,
      data: events
    } as ApiResponse<ConversionEvent[]>)
  } catch (error) {
    console.error('获取事件列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取事件列表失败'
    } as ApiResponse, { status: 500 })
  }
}

// 记录新的转化事件
export async function POST(request: NextRequest) {
  try {
    const shop = getShopFromRequest(request)
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '无效的商店信息'
      } as ApiResponse, { status: 400 })
    }

    const body = await request.json()
    const { eventType, value, currency, transactionId, productId, data } = body

    // 创建事件记录
    const event: ConversionEvent = {
      id: generateEventId(),
      shop,
      eventType,
      timestamp: new Date().toISOString(),
      value,
      currency,
      transactionId,
      productId,
      status: 'success',
      data
    }

    // 保存事件到存储
    await Storage.addEvent(shop, event)

    // 更新统计信息
    await Storage.updateStats(shop, eventType)

    return NextResponse.json({
      success: true,
      data: event,
      message: '事件记录成功'
    } as ApiResponse<ConversionEvent>)
  } catch (error) {
    console.error('记录事件失败:', error)
    return NextResponse.json({
      success: false,
      error: '记录事件失败'
    } as ApiResponse, { status: 500 })
  }
}

// 获取事件统计
export async function PUT(request: NextRequest) {
  try {
    const shop = getShopFromRequest(request)
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '无效的商店信息'
      } as ApiResponse, { status: 400 })
    }

    const stats = await Storage.getStats(shop)

    return NextResponse.json({
      success: true,
      data: stats
    } as ApiResponse<EventStats>)
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取统计信息失败'
    } as ApiResponse, { status: 500 })
  }
}

// 从请求中获取商店标识
function getShopFromRequest(request: NextRequest): string | null {
  const shop = request.nextUrl.searchParams.get('shop')
  return shop || 'demo-shop.myshopify.com'
}

// 生成事件ID
function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
} 