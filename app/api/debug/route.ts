import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@/lib/storage'

interface SessionData {
  shop: string
  accessToken: string
  scope: string
  installedAt: string
}

interface DebugOAuthInfo {
  hasSession: boolean
  hasAccessToken: boolean
  sessionDetails: {
    scope: string
    installedAt: string
  } | null
}

interface DebugConfigInfo {
  hasConfig: boolean
  hasGoogleAds: boolean
  conversionId: string | null
}

interface DebugScriptInfo {
  isInstalled: boolean
  installDetails: unknown
}

interface DebugInfo {
  shop: string
  timestamp: string
  oauth: DebugOAuthInfo
  config: DebugConfigInfo
  script: DebugScriptInfo
}

// 调试API - 检查应用状态
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

    // 检查各种状态
    const sessionData = await Storage.getCache(`shop:${shop}:session`) as SessionData | null
    const config = await Storage.getShopConfig(shop)
    const scriptStatus = await Storage.getCache(`shop:${shop}:script_installed`)

    const debugInfo: DebugInfo = {
      shop,
      timestamp: new Date().toISOString(),
      oauth: {
        hasSession: !!sessionData,
        hasAccessToken: !!sessionData?.accessToken,
        sessionDetails: sessionData ? {
          scope: sessionData.scope,
          installedAt: sessionData.installedAt
        } : null
      },
      config: {
        hasConfig: !!config,
        hasGoogleAds: !!(config?.googleAds?.conversionId),
        conversionId: config?.googleAds?.conversionId || null
      },
      script: {
        isInstalled: !!scriptStatus,
        installDetails: scriptStatus
      }
    }

    return NextResponse.json({
      success: true,
      data: debugInfo
    })
  } catch (error) {
    console.error('调试检查失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '调试失败'
    }, { status: 500 })
  }
} 