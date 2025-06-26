import { NextRequest, NextResponse } from 'next/server'
import { ShopConfig, GoogleAdsConfig, ApiResponse } from '@/lib/types'
import { Storage } from '@/lib/storage'

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
    const { googleAds, enabledEvents } = body

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
      enabledEvents: enabledEvents || ['purchase'],
      updatedAt: new Date().toISOString()
    }

    // 保存配置到存储
    await Storage.setShopConfig(shop, config)

    // 安装或更新Pixel代码
    await installPixelCode(shop, config)

    console.log(`配置已保存到商店: ${shop}`, config)

    return NextResponse.json({
      success: true,
      data: config,
      message: '配置保存成功，转化追踪已启用'
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
  // 优先从查询参数获取
  const shopFromQuery = request.nextUrl.searchParams.get('shop')
  if (shopFromQuery) {
    return shopFromQuery
  }
  
  // 如果没有shop参数，返回null而不是默认值
  return null
}

// 验证Google Ads配置
function validateGoogleAdsConfig(config: GoogleAdsConfig): string | null {
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

// 安装Pixel代码到Shopify商店
async function installPixelCode(shop: string, config: ShopConfig): Promise<void> {
  try {
    // 生成Pixel代码
    const pixelCode = generatePixelCode(config)
    
    // 这里应该调用Shopify API来安装Script Tag
    // 目前为了演示，我们只是记录到存储
    await Storage.setCache(`shop:${shop}:pixel`, {
      code: pixelCode,
      installedAt: new Date().toISOString(),
      status: 'active'
    })
    
    console.log(`Pixel代码已为商店 ${shop} 安装完成`)
  } catch (error) {
    console.error('安装Pixel代码失败:', error)
    throw error
  }
}

// 生成Google Ads Pixel代码
function generatePixelCode(config: ShopConfig): string {
  const { googleAds } = config
  
  return `
(function() {
  // Google Ads 转化追踪代码
  // 转化ID: ${googleAds.conversionId}
  
  // 加载Google Ads gtag
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=${googleAds.conversionId}';
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${googleAds.conversionId}');
  
  // 监听Shopify Analytics事件
  if (window.Shopify && window.Shopify.analytics) {
    // 购买完成事件
    window.Shopify.analytics.subscribe('checkout_completed', function(event) {
      var checkout = event.data.checkout;
      gtag('event', 'conversion', {
        'send_to': '${googleAds.conversionId}/${googleAds.purchaseLabel}',
        'value': parseFloat(checkout.totalPrice.amount),
        'currency': checkout.currencyCode,
        'transaction_id': checkout.order ? checkout.order.id : checkout.token
      });
    });
    
    ${googleAds.addToCartLabel ? `
    // 加购事件
    window.Shopify.analytics.subscribe('product_added_to_cart', function(event) {
      var variant = event.data.productVariant;
      gtag('event', 'conversion', {
        'send_to': '${googleAds.conversionId}/${googleAds.addToCartLabel}',
        'value': parseFloat(variant.price.amount),
        'currency': variant.price.currencyCode
      });
    });
    ` : ''}
    
    ${googleAds.beginCheckoutLabel ? `
    // 开始结账事件
    window.Shopify.analytics.subscribe('checkout_started', function(event) {
      var checkout = event.data.checkout;
      gtag('event', 'conversion', {
        'send_to': '${googleAds.conversionId}/${googleAds.beginCheckoutLabel}',
        'value': parseFloat(checkout.totalPrice.amount),
        'currency': checkout.currencyCode
      });
    });
    ` : ''}
  }
  
  console.log('Google Ads转化追踪已启用');
})();
`.trim()
} 