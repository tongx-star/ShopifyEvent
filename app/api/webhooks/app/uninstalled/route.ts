import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@/lib/shopify'
import { Storage } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256')

    if (!hmacHeader || !verifyWebhook(body, hmacHeader)) {
      console.error('Webhook HMAC验证失败')
      return NextResponse.json(
        { error: 'Webhook验证失败' },
        { status: 401 }
      )
    }

    const data = JSON.parse(body)
    const shop = data.domain

    if (!shop) {
      return NextResponse.json(
        { error: '缺少商店信息' },
        { status: 400 }
      )
    }

    console.log(`开始清理商店 ${shop} 的数据...`)

    // 清理商店相关数据
    await cleanupShopData(shop)

    console.log(`应用已从商店 ${shop} 卸载，数据清理完成`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('处理卸载webhook失败:', error)
    return NextResponse.json(
      { error: '处理失败' },
      { status: 500 }
    )
  }
}

// 清理商店数据
async function cleanupShopData(shop: string): Promise<void> {
  try {
    // 清理商店配置
    await Storage.deleteCache(`shop:${shop}:config`)
    
    // 清理会话数据
    await Storage.deleteCache(`shop:${shop}:session`)
    
    // 清理脚本安装状态
    await Storage.deleteCache(`shop:${shop}:script_installed`)
    
    // 清理事件数据 - 保留一段时间用于分析，30天后自动过期
    await Storage.setCache(`shop:${shop}:uninstalled_at`, new Date().toISOString(), 30 * 24 * 3600)
    
    // 标记商店为已卸载状态
    await Storage.setCache(`shop:${shop}:status`, 'uninstalled', 30 * 24 * 3600)
    
    console.log(`商店 ${shop} 数据清理完成`)
  } catch (error) {
    console.error(`清理商店 ${shop} 数据失败:`, error)
    throw error
  }
} 