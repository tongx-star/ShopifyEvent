import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@/lib/storage'
import { installScriptTag } from '@/lib/shopify'

// 手动安装Script Tag到商店
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

    // 获取商店配置
    const config = await Storage.getShopConfig(shop)
    if (!config || !config.googleAds?.conversionId) {
      return NextResponse.json({
        success: false,
        error: '商店未配置Google Ads设置，请先完成配置'
      }, { status: 400 })
    }

    // 获取商店的访问令牌（这里需要实际的访问令牌）
    const accessToken = await getAccessToken(shop)
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: '无法获取商店访问令牌，请重新安装应用'
      }, { status: 403 })
    }

    // 生成Script Tag源URL
    const scriptSrc = `${process.env.SHOPIFY_APP_URL || 'https://shopify-event.vercel.app'}/api/pixel?shop=${shop}`
    
    // 安装Script Tag
    const installed = await installScriptTag(shop, accessToken, scriptSrc)
    
    if (installed) {
      // 记录安装状态
      await Storage.setCache(`shop:${shop}:script_installed`, {
        installedAt: new Date().toISOString(),
        scriptSrc,
        status: 'active'
      })

      return NextResponse.json({
        success: true,
        message: 'Google Ads追踪脚本安装成功',
        data: {
          scriptSrc,
          conversionId: config.googleAds.conversionId,
          installedAt: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Script Tag安装失败，请检查应用权限'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('安装Script Tag失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '安装失败'
    }, { status: 500 })
  }
}

// 检查Script Tag安装状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    if (!shop) {
      return NextResponse.json({
        success: false,
        error: '缺少商店参数'
      }, { status: 400 })
    }

    // 获取安装状态
    const installStatus = await Storage.getCache(`shop:${shop}:script_installed`)
    const config = await Storage.getShopConfig(shop)
    
    return NextResponse.json({
      success: true,
      data: {
        isInstalled: !!installStatus,
        installDetails: installStatus,
        hasConfig: !!(config?.googleAds?.conversionId),
        config: config?.googleAds
      }
    })
  } catch (error) {
    console.error('检查安装状态失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '检查失败'
    }, { status: 500 })
  }
}

// 获取访问令牌
async function getAccessToken(shop: string): Promise<string | null> {
  try {
    // 从会话存储中获取访问令牌
    const sessionData = await Storage.getSession(`shop:${shop}`) as { accessToken?: string } | null
    
    if (sessionData?.accessToken) {
      return sessionData.accessToken
    }
    
    return null
  } catch (error) {
    console.error('获取访问令牌失败:', error)
    return null
  }
} 