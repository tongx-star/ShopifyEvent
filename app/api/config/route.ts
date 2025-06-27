import { NextRequest, NextResponse } from 'next/server'
import { ShopConfig, GoogleAdsConfig, ApiResponse } from '@/lib/types'
import { Storage } from '@/lib/storage'

// 强制动态路由
export const dynamic = 'force-dynamic'

// 获取商店配置
export async function GET(request: NextRequest) {
  try {
    const shop = getShopFromRequest(request)
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '无效的商店信息'
      } as ApiResponse, { status: 400 })
    }

    const config = await Storage.getShopConfig(shop)
    
    return NextResponse.json({
      success: true,
      data: config
    } as ApiResponse<ShopConfig>)
  } catch (error) {
    console.error('获取配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    } as ApiResponse, { status: 500 })
  }
}

// 保存商店配置
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
    console.log('接收到的请求数据:', JSON.stringify(body, null, 2))
    
    const { googleAds } = body

    // 检查googleAds是否存在
    if (!googleAds) {
      return NextResponse.json({
        success: false,
        error: '缺少Google Ads配置数据'
      } as ApiResponse, { status: 400 })
    }

    // 验证Google Ads配置
    const validationError = validateGoogleAdsConfig(googleAds)
    if (validationError) {
      return NextResponse.json({
        success: false,
        error: validationError
      } as ApiResponse, { status: 400 })
    }

    const config: ShopConfig = {
      shop,
      googleAds,
      updatedAt: new Date().toISOString()
    }

    // 保存配置到存储
    await Storage.setShopConfig(shop, config)

    console.log(`配置已保存到商店: ${shop}`)

    return NextResponse.json({
      success: true,
      data: config,
      message: '配置保存成功，请在Shopify管理后台的"设置 > 客户事件"中配置Web Pixels扩展'
    } as ApiResponse<ShopConfig>)
  } catch (error) {
    console.error('保存配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '保存配置失败，请重试'
    } as ApiResponse, { status: 500 })
  }
}

// 从请求中获取商店标识
function getShopFromRequest(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get('shop')
}

// 验证Google Ads配置
function validateGoogleAdsConfig(config: GoogleAdsConfig | null | undefined): string | null {
  if (!config) {
    return 'Google Ads配置不能为空'
  }

  if (!config.conversionId) {
    return '转化ID不能为空'
  }

  if (!config.conversionId.match(/^AW-\d+$/)) {
    return '转化ID格式错误，应为 AW-xxxxxxxxx 格式'
  }

  if (!config.purchaseLabel) {
    return '购买转化标签不能为空'
  }

  return null
} 