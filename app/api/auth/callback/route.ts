import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@/lib/storage'
import { SHOPIFY_CONFIG, validateShopDomain } from '@/lib/shopify'

// 强制动态路由
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const shop = searchParams.get('shop')
    const state = searchParams.get('state')
    
    if (!code || !shop) {
      console.error('OAuth回调缺少必要参数:', { code: !!code, shop: !!shop })
      return NextResponse.redirect(`${SHOPIFY_CONFIG.appUrl}/auth/error?message=缺少授权参数`)
    }

    // 验证商店域名格式
    if (!validateShopDomain(shop)) {
      console.error('无效的商店域名:', shop)
      return NextResponse.redirect(`${SHOPIFY_CONFIG.appUrl}/auth/error?message=无效的商店域名`)
    }

    // 验证state参数 - 防止CSRF攻击
    if (state) {
      const storedState = await Storage.getCache(`oauth_state:${state}`)
      if (!storedState) {
        console.error('无效的state参数:', state)
        return NextResponse.redirect(`${SHOPIFY_CONFIG.appUrl}/auth/error?message=无效的授权状态`)
      }
      // 清理使用过的state
      await Storage.deleteCache(`oauth_state:${state}`)
    }

    // 交换授权码获取访问令牌
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CONFIG.apiKey,
        client_secret: SHOPIFY_CONFIG.apiSecret,
        code
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('获取访问令牌失败:', tokenResponse.status, errorText)
      throw new Error(`获取访问令牌失败: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, scope } = tokenData

    if (!access_token) {
      throw new Error('访问令牌为空')
    }

    // 保存会话数据到存储 - 使用较长的TTL (24小时)
    const sessionData = {
      shop,
      accessToken: access_token,
      scope,
      installedAt: new Date().toISOString()
    }
    
    await Storage.setCache(`shop:${shop}:session`, sessionData, 86400) // 24小时

    console.log(`应用已安装到商店: ${shop}, scope: ${scope}`)

    // 重定向到应用主页
    const appUrl = `${SHOPIFY_CONFIG.appUrl}?shop=${shop}`
    return NextResponse.redirect(appUrl)
    
  } catch (error) {
    console.error('OAuth回调处理失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.redirect(`${SHOPIFY_CONFIG.appUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`)
  }
} 