'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Page,
  Button,
  Banner,
  Text,
  Box,
  Spinner,
  Badge,
  List,
  ButtonGroup,
  Divider
} from '@shopify/polaris'

interface GoogleAdsConfig {
  conversionId: string
  purchaseLabel?: string
  addToCartLabel?: string
  beginCheckoutLabel?: string
  enhancedConversions?: boolean
}

interface ScriptInstallDetails {
  installedAt: string
  scriptSrc: string
}

interface DiagnosisResult {
  configStatus: 'success' | 'warning' | 'error'
  configMessage: string
  config?: GoogleAdsConfig
  oauthStatus: 'success' | 'warning' | 'error'
  oauthMessage: string
  oauthDetails?: {
    hasSession: boolean
    hasAccessToken: boolean
    sessionDetails?: {
      scope: string
      installedAt: string
    } | null
  }
  scriptStatus: 'success' | 'warning' | 'error'
  scriptMessage: string
  scriptDetails?: {
    isInstalled: boolean
    installDetails?: ScriptInstallDetails
  }
  pixelStatus: 'success' | 'warning' | 'error'
  pixelMessage: string
  frontendStatus: 'success' | 'warning' | 'error'
  frontendMessage: string
}

export default function DiagnosisPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DiagnosisResult | null>(null)
  const [shop, setShop] = useState('')

  // 获取商店参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shopParam = urlParams.get('shop') || 'xn-0zwm56daa.myshopify.com'
    setShop(shopParam)
  }, [])

  // 执行完整诊断
  const runDiagnosis = useCallback(async () => {
    if (!shop) return

    setLoading(true)
    const diagnosis: DiagnosisResult = {
      configStatus: 'error',
      configMessage: '',
      oauthStatus: 'error',
      oauthMessage: '',
      scriptStatus: 'error', 
      scriptMessage: '',
      pixelStatus: 'error',
      pixelMessage: '',
      frontendStatus: 'error',
      frontendMessage: ''
    }

    try {
      // 1. 检查配置状态
      console.log('🔍 检查配置状态...')
      try {
        const configResponse = await fetch(`/api/config?shop=${shop}`)
        const configData = await configResponse.json()
        
        if (configData.success && configData.data?.googleAds?.conversionId) {
          diagnosis.configStatus = 'success'
          diagnosis.configMessage = `✅ 配置正常，转化ID: ${configData.data.googleAds.conversionId}`
          diagnosis.config = configData.data.googleAds
        } else {
          diagnosis.configStatus = 'warning'
          diagnosis.configMessage = '⚠️ 未找到Google Ads配置，请先完成配置'
        }
      } catch (error) {
        diagnosis.configStatus = 'error'
        diagnosis.configMessage = '❌ 配置检查失败: ' + (error as Error).message
      }

      // 2. 检查OAuth授权状态
      console.log('🔍 检查OAuth授权状态...')
      try {
        const debugResponse = await fetch(`/api/debug?shop=${shop}`)
        const debugData = await debugResponse.json()
        
        if (debugData.success && debugData.data.oauth.hasAccessToken) {
          diagnosis.oauthStatus = 'success'
          diagnosis.oauthMessage = '✅ OAuth授权正常，应用已获得访问权限'
          diagnosis.oauthDetails = debugData.data.oauth
        } else if (debugData.success && debugData.data.oauth.hasSession) {
          diagnosis.oauthStatus = 'warning'
          diagnosis.oauthMessage = '⚠️ 有会话但缺少访问令牌，可能需要重新授权'
          diagnosis.oauthDetails = debugData.data.oauth
        } else {
          diagnosis.oauthStatus = 'error'
          diagnosis.oauthMessage = '❌ 应用未授权，请重新安装应用'
          diagnosis.oauthDetails = debugData.success ? debugData.data.oauth : undefined
        }
      } catch (error) {
        diagnosis.oauthStatus = 'error'
        diagnosis.oauthMessage = '❌ OAuth状态检查失败: ' + (error as Error).message
      }

      // 3. 检查Script Tag安装状态
      console.log('🔍 检查Script Tag安装状态...')
      try {
        const scriptResponse = await fetch(`/api/install-script?shop=${shop}`)
        const scriptData = await scriptResponse.json()
        
        if (scriptData.success && scriptData.data.isInstalled) {
          diagnosis.scriptStatus = 'success'
          diagnosis.scriptMessage = '✅ 追踪脚本已安装到商店'
          diagnosis.scriptDetails = scriptData.data
        } else {
          diagnosis.scriptStatus = 'warning'
          diagnosis.scriptMessage = '⚠️ 追踪脚本未安装，需要手动安装'
        }
      } catch (error) {
        diagnosis.scriptStatus = 'error'
        diagnosis.scriptMessage = '❌ Script Tag检查失败: ' + (error as Error).message
      }

      // 4. 检查Pixel代码生成
      console.log('🔍 检查Pixel代码生成...')
      try {
        const pixelResponse = await fetch(`/api/pixel?shop=${shop}`)
        if (pixelResponse.ok) {
          const pixelCode = await pixelResponse.text()
          if (pixelCode.includes('Google Ads') && pixelCode.includes('gtag')) {
            diagnosis.pixelStatus = 'success'
            diagnosis.pixelMessage = '✅ Pixel代码生成正常'
          } else {
            diagnosis.pixelStatus = 'warning'
            diagnosis.pixelMessage = '⚠️ Pixel代码格式异常'
          }
        } else {
          diagnosis.pixelStatus = 'error'
          diagnosis.pixelMessage = '❌ Pixel代码获取失败'
        }
      } catch (error) {
        diagnosis.pixelStatus = 'error'
        diagnosis.pixelMessage = '❌ Pixel代码检查失败: ' + (error as Error).message
      }

      // 5. 检查前端环境
      console.log('🔍 检查前端环境...')
      try {
        // 检查是否有Google Analytics
        const hasGtag = typeof window.gtag !== 'undefined'
        const hasDataLayer = typeof window.dataLayer !== 'undefined'
        
        if (hasGtag || hasDataLayer) {
          diagnosis.frontendStatus = 'success'
          diagnosis.frontendMessage = '✅ 前端追踪环境正常'
        } else {
          diagnosis.frontendStatus = 'warning'
          diagnosis.frontendMessage = '⚠️ 前端尚未加载Google Analytics，这是正常的，脚本会自动加载'
        }
      } catch (error) {
        diagnosis.frontendStatus = 'error'
        diagnosis.frontendMessage = '❌ 前端环境检查失败: ' + (error as Error).message
      }

      setResults(diagnosis)
    } catch (error) {
      console.error('诊断失败:', error)
    } finally {
      setLoading(false)
    }
  }, [shop])

  // 手动安装Script Tag
  const installScript = useCallback(async () => {
    if (!shop) return

    try {
      const response = await fetch(`/api/install-script?shop=${shop}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert('追踪脚本安装成功！')
        runDiagnosis() // 重新运行诊断
      } else {
        alert('安装失败: ' + data.error)
      }
    } catch (error) {
      alert('安装失败: ' + (error as Error).message)
    }
  }, [shop, runDiagnosis])

  // 测试Pixel代码加载
  const testPixelLoading = useCallback(async () => {
    if (!shop) return

    try {
      const response = await fetch(`/api/pixel?shop=${shop}`)
      const pixelCode = await response.text()
      
      if (response.ok) {
        // 在当前页面执行Pixel代码进行测试
        const script = document.createElement('script')
        script.textContent = pixelCode
        document.head.appendChild(script)
        
        alert('Pixel代码已在当前页面加载，请查看浏览器控制台')
      } else {
        alert('Pixel代码加载失败')
      }
    } catch (error) {
      alert('测试失败: ' + (error as Error).message)
    }
  }, [shop])

  // 重新授权应用
  const reauthorizeApp = useCallback(() => {
    if (!shop) return
    
    // 构建Shopify OAuth授权URL
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'bfee0f68be66b95b20d3925bb62bd2a5'
    const scope = 'read_script_tags,write_script_tags'
    const redirectUri = `${window.location.origin}/api/auth/callback`
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: shop
    }).toString()
    
    // 重定向到授权页面
    window.location.href = authUrl
  }, [shop])

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge tone="success">正常</Badge>
      case 'warning':
        return <Badge tone="attention">警告</Badge>
      case 'error':
        return <Badge tone="critical">错误</Badge>
    }
  }

  return (
    <Page
      title="Google Ads 追踪诊断"
      subtitle={`商店: ${shop}`}
      primaryAction={{
        content: loading ? '诊断中...' : '运行诊断',
        onAction: runDiagnosis,
        loading
      }}
    >
      <Box paddingBlockEnd="400">
        <Banner tone="info">
          <Text as="p">
            这个诊断工具将检查您的Google Ads追踪配置、Script Tag安装状态和代码生成情况。
            如果发现问题，会提供相应的修复建议。
          </Text>
        </Banner>
      </Box>

      {results && (
        <Card>
          <Box padding="400">
            <Text as="h2" variant="headingMd">诊断结果</Text>
            
            <Box paddingBlockStart="400">
              <List type="bullet">
                <List.Item>
                  <Box>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text as="span" fontWeight="semibold">配置状态:</Text>
                      {getStatusBadge(results.configStatus)}
                    </div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {results.configMessage}
                    </Text>
                    {results.config && (
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodySm">
                          转化ID: {results.config.conversionId}<br/>
                          购买标签: {results.config.purchaseLabel}<br/>
                          {results.config.addToCartLabel && `加购标签: ${results.config.addToCartLabel}`}<br/>
                          {results.config.beginCheckoutLabel && `结账标签: ${results.config.beginCheckoutLabel}`}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </List.Item>

                <List.Item>
                  <Box>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text as="span" fontWeight="semibold">OAuth授权状态:</Text>
                      {getStatusBadge(results.oauthStatus)}
                    </div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {results.oauthMessage}
                    </Text>
                  </Box>
                </List.Item>

                <List.Item>
                  <Box>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text as="span" fontWeight="semibold">Script Tag状态:</Text>
                      {getStatusBadge(results.scriptStatus)}
                    </div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {results.scriptMessage}
                    </Text>
                    {results.scriptDetails && (
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodySm">
                          安装时间: {new Date(results.scriptDetails.installDetails?.installedAt || '').toLocaleString()}<br/>
                          脚本源: {results.scriptDetails.installDetails?.scriptSrc}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </List.Item>

                <List.Item>
                  <Box>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text as="span" fontWeight="semibold">Pixel代码状态:</Text>
                      {getStatusBadge(results.pixelStatus)}
                    </div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {results.pixelMessage}
                    </Text>
                  </Box>
                </List.Item>

                <List.Item>
                  <Box>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text as="span" fontWeight="semibold">前端环境:</Text>
                      {getStatusBadge(results.frontendStatus)}
                    </div>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {results.frontendMessage}
                    </Text>
                  </Box>
                </List.Item>
              </List>
            </Box>

            <Divider />

            <Box paddingBlockStart="400">
              <Text as="h3" variant="headingSm">操作建议</Text>
              <Box paddingBlockStart="200">
                {results.oauthStatus === 'error' && (
                  <Banner tone="critical">
                    <Text as="p">
                      ❌ 应用授权失败。这通常是因为应用没有正确安装或授权已过期。请重新授权应用。
                    </Text>
                  </Banner>
                )}

                {results.oauthStatus === 'warning' && (
                  <Box paddingBlockStart="200">
                    <Banner tone="warning">
                      <Text as="p">
                        ⚠️ 授权状态异常。建议重新授权应用以确保正常工作。
                      </Text>
                    </Banner>
                  </Box>
                )}

                {results.configStatus !== 'success' && results.oauthStatus === 'success' && (
                  <Banner tone="warning">
                    <Text as="p">
                      请先在应用主页完成Google Ads配置，包括转化ID和购买标签。
                    </Text>
                  </Banner>
                )}
                
                {results.configStatus === 'success' && results.oauthStatus === 'success' && results.scriptStatus !== 'success' && (
                  <Box paddingBlockStart="200">
                    <Banner tone="info">
                      <Text as="p">
                        配置已完成，但追踪脚本尚未安装。点击下方按钮手动安装。
                      </Text>
                    </Banner>
                  </Box>
                )}

                {results.configStatus === 'success' && results.oauthStatus === 'success' && results.scriptStatus === 'success' && (
                  <Box paddingBlockStart="200">
                    <Banner tone="success">
                      <Text as="p">
                        🎉 恭喜！您的Google Ads追踪已完全配置好。现在可以开始追踪转化数据了。
                      </Text>
                    </Banner>
                  </Box>
                )}
              </Box>
            </Box>

            <Box paddingBlockStart="400">
              <ButtonGroup>
                {(results.oauthStatus === 'error' || results.oauthStatus === 'warning') && (
                  <Button variant="primary" tone="critical" onClick={reauthorizeApp}>
                    重新授权应用
                  </Button>
                )}

                {results.configStatus === 'success' && results.oauthStatus === 'success' && results.scriptStatus !== 'success' && (
                  <Button variant="primary" onClick={installScript}>
                    安装追踪脚本
                  </Button>
                )}
                
                <Button onClick={testPixelLoading}>
                  测试Pixel代码加载
                </Button>
                
                <Button 
                  url={`/?shop=${shop}`}
                  variant="secondary"
                >
                  返回配置页面
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        </Card>
      )}

      {loading && (
        <Card>
          <Box padding="400">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              <Spinner size="small" />
              <Text as="span">正在运行诊断检查...</Text>
            </div>
          </Box>
        </Card>
      )}

      {!results && !loading && (
        <Card>
          <Box padding="400">
            <Text as="p" variant="bodyMd" tone="subdued">
              点击&ldquo;运行诊断&rdquo;开始检查您的Google Ads追踪配置状态。
            </Text>
          </Box>
        </Card>
      )}
    </Page>
  )
} 