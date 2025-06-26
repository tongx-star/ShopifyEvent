import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@/lib/storage'
import { SHOPIFY_CONFIG } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const shop = searchParams.get('shop')
    
    if (!code || !shop) {
      return NextResponse.redirect('/auth/error?message=缺少授权参数')
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
      throw new Error(`获取访问令牌失败: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, scope } = tokenData

    // 保存会话数据到存储 - 使用较长的TTL (24小时)
    const sessionData = {
      shop,
      accessToken: access_token,
      scope,
      installedAt: new Date().toISOString()
    }
    
    await Storage.setCache(`shop:${shop}:session`, sessionData, 86400) // 24小时

    console.log(`应用已安装到商店: ${shop}, 访问令牌已保存`)

    // 重定向到应用主页
    const appUrl = `${SHOPIFY_CONFIG.appUrl}?shop=${shop}`
    return NextResponse.redirect(appUrl)
    
  } catch (error) {
    console.error('OAuth回调处理失败:', error)
    return new Response('OAuth授权失败', { status: 500 })
  }
} 