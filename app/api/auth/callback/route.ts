import { NextRequest, NextResponse } from 'next/server'
import { validateShopDomain } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shop = searchParams.get('shop')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!shop || !code || !state) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    if (!validateShopDomain(shop)) {
      return NextResponse.json(
        { error: '无效的商店域名' },
        { status: 400 }
      )
    }

    // 验证state参数
    const cookies = request.cookies
    const storedState = cookies.get('shopify_oauth_state')?.value

    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'State验证失败' },
        { status: 400 }
      )
    }

    // TODO: 交换授权码获取访问令牌
    // TODO: 存储会话信息
    // TODO: 安装Script Tag

    // 重定向到应用主页
    const appUrl = `/?shop=${shop}&installed=true`
    return NextResponse.redirect(new URL(appUrl, request.url))

  } catch (error) {
    console.error('OAuth回调处理失败:', error)
    return NextResponse.json(
      { error: 'OAuth回调处理失败' },
      { status: 500 }
    )
  }
} 