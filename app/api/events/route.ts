import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, EventStats, ConversionEvent } from '@/lib/types'
import { Storage } from '@/lib/storage'

// 强制动态路由
export const dynamic = 'force-dynamic'

// 获取事件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '缺少商店参数'
      }, { status: 400 })
    }

    // 获取最近的事件
    const recentEventsKey = `shop:${shop}:events`
    const events = await Storage.getCache(recentEventsKey) as ConversionEvent[] || []
    
    return NextResponse.json({
      success: true,
      data: {
        events: events.slice(0, limit),
        count: events.length,
        shop
      }
    })

  } catch (error) {
    console.error('获取事件失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取事件失败'
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
    const { eventType, value, currency, transactionId } = eventData

    if (!eventType) {
      return NextResponse.json({
        success: false,
        error: '缺少事件类型'
      }, { status: 400 })
    }

    // 创建事件记录
    const event: ConversionEvent = {
      id: `${shop}_${eventType}_${Date.now()}`,
      shop,
      eventType,
      timestamp: new Date().toISOString(),
      value,
      currency,
      transactionId,
      status: 'success'
    }

    // 保存事件
    const eventsKey = `shop:${shop}:events`
    const existingEvents = await Storage.getCache(eventsKey) as ConversionEvent[] || []
    existingEvents.unshift(event)
    
    // 只保留最近100个事件
    if (existingEvents.length > 100) {
      existingEvents.splice(100)
    }
    
    await Storage.setCache(eventsKey, existingEvents)

    console.log(`记录转化事件: ${shop} - ${eventType}`)

    return NextResponse.json({
      success: true,
      message: '事件记录成功',
      data: { eventId: event.id }
    })

  } catch (error) {
    console.error('记录事件失败:', error)
    return NextResponse.json({
      success: false,
      error: '记录事件失败'
    }, { status: 500 })
  }
}

// 获取事件统计
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '缺少商店参数'
      }, { status: 400 })
    }

    const eventsKey = `shop:${shop}:events`
    const events = await Storage.getCache(eventsKey) as ConversionEvent[] || []
    
    const stats: EventStats = {
      totalEvents: events.length,
      purchases: events.filter(e => e.eventType === 'purchase').length,
      addToCarts: events.filter(e => e.eventType === 'add_to_cart').length,
      beginCheckouts: events.filter(e => e.eventType === 'begin_checkout').length,
      lastEventAt: events.length > 0 ? events[0].timestamp : null
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
    }, { status: 500 })
  }
} 