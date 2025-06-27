import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@/lib/storage'
import { ApiResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '缺少商店参数'
      } as ApiResponse, { status: 400 })
    }

    // 获取商店配置
    const config = await Storage.getShopConfig(shop)
    
    // 获取最近事件统计
    const eventsKey = `shop:${shop}:events`
    const events = await Storage.getCache(eventsKey) || []
    const eventCount = Array.isArray(events) ? events.length : 0

    const debugInfo = {
      shop,
      timestamp: new Date().toISOString(),
      config: {
        hasConfig: !!config,
        hasGoogleAds: !!(config?.googleAds?.conversionId),
        conversionId: config?.googleAds?.conversionId || null,
        purchaseLabel: config?.googleAds?.purchaseLabel || null,
        addToCartLabel: config?.googleAds?.addToCartLabel || null,
        beginCheckoutLabel: config?.googleAds?.beginCheckoutLabel || null,
        enhancedConversions: config?.googleAds?.enhancedConversions || false
      },
      events: {
        totalRecorded: eventCount,
        lastCheck: new Date().toISOString()
      },
      webPixels: {
        extensionType: 'web_pixel_extension',
        configurationRequired: 'Shopify Admin > Settings > Customer Events'
      }
    }

    return NextResponse.json({
      success: true,
      data: debugInfo
    } as ApiResponse<typeof debugInfo>)

  } catch (error) {
    console.error('调试信息获取失败:', error)
    return NextResponse.json({
      success: false,
      error: '调试信息获取失败'
    } as ApiResponse, { status: 500 })
  }
} 