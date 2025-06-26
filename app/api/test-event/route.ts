import { NextRequest, NextResponse } from 'next/server'
import { TestEventRequest, ApiResponse, ShopConfig, EventData } from '@/lib/types'

// 发送测试事件
export async function POST(request: NextRequest) {
  try {
    const body: TestEventRequest = await request.json()
    const { eventType, testData } = body
    
    const shop = getShopFromRequest(request)
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '无效的商店信息'
      } as ApiResponse, { status: 400 })
    }

    // 验证配置
    const config = await getShopConfig(shop)
    if (!config) {
      return NextResponse.json({
        success: false,
        error: '请先配置Google Ads转化设置'
      } as ApiResponse, { status: 400 })
    }

    // 验证事件类型是否已配置
    if (!isEventTypeConfigured(config, eventType)) {
      return NextResponse.json({
        success: false,
        error: `${eventType} 事件类型未配置转化标签`
      } as ApiResponse, { status: 400 })
    }

    // 生成测试数据
    const finalTestData: EventData = testData || generateTestData(eventType)

    // 模拟发送Google Ads事件
    const success = await simulateGoogleAdsEvent(config, eventType, finalTestData)

    // 记录测试事件
    await recordTestEvent(shop, eventType, finalTestData, success)

    return NextResponse.json({
      success: true,
      data: {
        eventType,
        testData: finalTestData,
        sent: success,
        timestamp: new Date().toISOString()
      },
      message: success ? '测试事件发送成功' : '测试事件发送失败'
    } as ApiResponse)

  } catch (error) {
    console.error('测试事件发送失败:', error)
    return NextResponse.json({
      success: false,
      error: '测试事件发送失败'
    } as ApiResponse, { status: 500 })
  }
}

// 从请求中获取商店标识
function getShopFromRequest(request: NextRequest): string | null {
  const shop = request.nextUrl.searchParams.get('shop')
  return shop || 'demo-shop.myshopify.com'
}

// 获取商店配置（模拟）
async function getShopConfig(shop: string): Promise<ShopConfig | null> {
  // 这里应该从实际存储中获取配置
  const mockConfig: ShopConfig = {
    shop,
    googleAds: {
      conversionId: 'AW-123456789',
      purchaseLabel: 'purchase_label',
      addToCartLabel: 'add_to_cart_label',
      beginCheckoutLabel: 'begin_checkout_label'
    },
    enabledEvents: ['purchase', 'add_to_cart', 'begin_checkout']
  }
  return mockConfig
}

// 检查事件类型是否已配置
function isEventTypeConfigured(config: ShopConfig, eventType: string): boolean {
  const { googleAds } = config
  switch (eventType) {
    case 'purchase':
      return !!googleAds.purchaseLabel
    case 'add_to_cart':
      return !!googleAds.addToCartLabel
    case 'begin_checkout':
      return !!googleAds.beginCheckoutLabel
    default:
      return false
  }
}

// 生成测试数据
function generateTestData(eventType: string): EventData {
  const baseData: EventData = {
    currency: 'USD',
    transaction_id: `test_${Date.now()}`
  }

  switch (eventType) {
    case 'purchase':
      return {
        ...baseData,
        value: 99.99,
        items: [{
          item_id: 'test_product_1',
          item_name: '测试商品',
          quantity: 1,
          price: 99.99
        }]
      }
    case 'add_to_cart':
      return {
        ...baseData,
        value: 49.99,
        product_id: 'test_product_2',
        product_name: '测试加购商品',
        quantity: 1
      }
    case 'begin_checkout':
      return {
        ...baseData,
        value: 149.99,
        items: [{
          item_id: 'test_product_3',
          item_name: '测试结账商品',
          quantity: 2,
          price: 74.99
        }]
      }
    default:
      return baseData
  }
}

// 模拟Google Ads事件发送
async function simulateGoogleAdsEvent(
  config: ShopConfig, 
  eventType: string, 
  testData: EventData
): Promise<boolean> {
  // 这里应该实际发送到Google Ads
  console.log('模拟发送Google Ads事件:', { 
    conversionId: config.googleAds.conversionId,
    eventType, 
    testData 
  })
  
  // 模拟成功（90%成功率）
  return Math.random() > 0.1
}

// 记录测试事件
async function recordTestEvent(
  shop: string, 
  eventType: string, 
  testData: EventData, 
  success: boolean
): Promise<void> {
  try {
    // 这里应该调用事件记录API
    const eventData = {
      shop,
      eventType,
      timestamp: new Date().toISOString(),
      value: testData.value,
      currency: testData.currency,
      transactionId: testData.transaction_id,
      status: success ? 'success' : 'failed',
      data: testData
    }
    
    console.log('记录测试事件:', eventData)
  } catch (error) {
    console.error('记录测试事件失败:', error)
  }
} 