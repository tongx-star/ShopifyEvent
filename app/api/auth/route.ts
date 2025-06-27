import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createShopifyOAuthUrl, validateShopDomain } from '@/lib/shopify'

// 强制动态路由
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shop = searchParams.get('shop')

    if (!shop || !validateShopDomain(shop)) {
      return NextResponse.json(
        { error: '无效的商店域名' },
        { status: 400 }
      )
    }

    // 生成state参数用于安全验证
    const state = crypto.randomBytes(32).toString('hex')
    
    // 创建OAuth URL
    const oauthUrl = createShopifyOAuthUrl(shop, state)
    
    // 存储state到session或数据库中以便后续验证
    const response = NextResponse.redirect(oauthUrl)
    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300 // 5分钟过期
    })
    
    return response
  } catch (error) {
    console.error('OAuth初始化失败:', error)
    return NextResponse.json(
      { error: '认证初始化失败' },
      { status: 500 }
    )
  }
} 