import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, EventStats } from '@/lib/types'
import { Storage } from '@/lib/storage'

interface EventRecord {
  id: string
  shop: string
  event: string
  data: Record<string, unknown>
  timestamp: string
  receivedAt: string
}

// 获取事件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    const eventType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '缺少商店参数'
      }, { status: 400 })
    }

    let events: EventRecord[] = []

    if (eventType) {
      // 获取特定类型的事件 - 暂时使用通用方法
      const recentEventsKey = `shop:${shop}:recent_events`
      const allEvents = await Storage.getCache(recentEventsKey) as EventRecord[] || []
      events = allEvents.filter(event => event.event === eventType).slice(0, limit)
    } else {
      // 获取最近的所有事件
      const recentEventsKey = `shop:${shop}:recent_events`
      const recentEvents = await Storage.getCache(recentEventsKey) as EventRecord[] || []
      events = recentEvents.slice(0, limit)
    }

    return NextResponse.json({
      success: true,
      data: {
        events,
        count: events.length,
        shop,
        eventType: eventType || 'all'
      }
    })

  } catch (error) {
    console.error('获取事件失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }, { status: 500 })
  }
}

// 记录转化事件
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '缺少商店参数'
      }, { status: 400 })
    }

    const eventData = await request.json()
    const { event, data, timestamp } = eventData

    if (!event || !data) {
      return NextResponse.json({
        success: false,
        error: '事件数据格式错误'
      }, { status: 400 })
    }

    // 创建事件记录
    const eventRecord: EventRecord = {
      id: `${shop}_${event}_${Date.now()}`,
      shop,
      event,
      data,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString()
    }

    // 保存事件 - 使用通用存储方法
    const eventKey = `shop:${shop}:events:${event}`
    const existingEvents = await Storage.getCache(eventKey) as EventRecord[] || []
    existingEvents.unshift(eventRecord)
    
    // 保留最近50个同类型事件
    if (existingEvents.length > 50) {
      existingEvents.splice(50)
    }
    
    await Storage.setCache(eventKey, existingEvents)

    // 同时保存到最近事件列表
    const recentEventsKey = `shop:${shop}:recent_events`
    const recentEvents = await Storage.getCache(recentEventsKey) as EventRecord[] || []
    
    // 添加新事件到列表开头，保留最近50个事件
    recentEvents.unshift(eventRecord)
    if (recentEvents.length > 50) {
      recentEvents.splice(50)
    }
    
    await Storage.setCache(recentEventsKey, recentEvents)

    console.log(`记录转化事件: ${shop} - ${event}`, {
      conversionId: data.send_to,
      value: data.value,
      currency: data.currency
    })

    return NextResponse.json({
      success: true,
      message: '事件记录成功',
      data: {
        eventId: eventRecord.id,
        receivedAt: eventRecord.receivedAt
      }
    })

  } catch (error) {
    console.error('记录事件失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '记录失败'
    }, { status: 500 })
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

    // 获取统计信息 - 使用简化版本
    const recentEventsKey = `shop:${shop}:recent_events`
    const recentEvents = await Storage.getCache(recentEventsKey) as EventRecord[] || []
    
    const stats: EventStats = {
      totalEvents: recentEvents.length,
      purchases: recentEvents.filter(e => e.event === 'purchase').length,
      addToCarts: recentEvents.filter(e => e.event === 'add_to_cart').length,
      beginCheckouts: recentEvents.filter(e => e.event === 'begin_checkout').length,
      lastEventAt: recentEvents.length > 0 ? recentEvents[0].timestamp : null
    }

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