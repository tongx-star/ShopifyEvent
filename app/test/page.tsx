'use client'

import { useState, useEffect, useCallback } from 'react'
import { Page, Card, Button, Layout, Text, Banner, TextField, Select } from '@shopify/polaris'

// 模拟Shopify Analytics事件
declare global {
  interface Window {
    Shopify?: {
      analytics?: {
        subscribe: (event: string, callback: (data: unknown) => void) => void
      }
    }
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __googleAdsPixelLoaded?: boolean
  }
}

interface ExtendedWindow extends Window {
  [key: string]: unknown
}

// 存储事件回调的全局变量
const eventCallbacks: Record<string, ((data: unknown) => void)[]> = {}

export default function TestPage() {
  const [pixelLoaded, setPixelLoaded] = useState(false)
  const [conversionsSent, setConversionsSent] = useState<string[]>([])
  const [testData, setTestData] = useState({
    eventType: 'purchase',
    value: '99.99',
    currency: 'USD',
    transactionId: '',
    productId: 'test-product-123'
  })

  const shop = 'demo-shop.myshopify.com'

  // 自动配置真实的Google Ads环境
  const setupRealConfig = async () => {
    try {
      addLog('⚙️ 正在设置真实的Google Ads配置...')
      
      const configData = {
        googleAds: {
          conversionId: "AW-11403892942",
          purchaseLabel: "zx0XCKPZic0ZEM6x5r0q",
          addToCartLabel: "",
          beginCheckoutLabel: "",
          enhancedConversions: false
        },
        enabledEvents: ["purchase"]
      }
      
      const response = await fetch(`/api/config?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })
      
      const result = await response.json()
      if (result.success) {
        addLog('✅ 真实Google Ads配置设置成功')
        addLog(`📋 转化ID: ${result.data.googleAds.conversionId}`)
        addLog(`📋 购买标签: ${result.data.googleAds.purchaseLabel}`)
        return true
      } else {
        addLog('❌ 配置设置失败: ' + result.error)
        return false
      }
    } catch (error) {
      addLog('❌ 配置设置出错: ' + (error as Error).message)
      return false
    }
  }

  // 加载Pixel代码
  const loadPixelCode = async () => {
    try {
      // 先检查是否有正确的配置
      const checkResponse = await fetch(`/api/config?shop=${shop}`)
      const checkResult = await checkResponse.json()
      
      const needsRealConfig = !checkResult.success || 
                             !checkResult.data?.googleAds?.conversionId ||
                             checkResult.data.googleAds.conversionId !== "AW-11403892942"
      
      if (needsRealConfig) {
        addLog('⚠️ 未发现正确配置，开始设置真实配置...')
        const configSuccess = await setupRealConfig()
        if (!configSuccess) {
          return
        }
      } else {
        addLog('✅ 发现正确的Google Ads配置')
        addLog(`📋 转化ID: ${checkResult.data.googleAds.conversionId}`)
        addLog(`📋 购买标签: ${checkResult.data.googleAds.purchaseLabel}`)
      }
      
      const response = await fetch(`/api/pixel?shop=${shop}`)
      const pixelCode = await response.text()
      
      if (response.ok) {
        // 移除已有的Pixel代码
        const existingScript = document.querySelector('script[data-google-ads-pixel]')
        if (existingScript) {
          existingScript.remove()
        }
        
        // 创建script标签并执行Pixel代码
        const script = document.createElement('script')
        script.setAttribute('data-google-ads-pixel', 'true')
        script.textContent = pixelCode
        document.head.appendChild(script)
        
        setPixelLoaded(true)
        addLog('✅ Pixel代码加载成功')
        addLog(`📊 Pixel代码长度: ${pixelCode.length} 字符`)
        
        // 等待一下让Pixel代码完全初始化
        setTimeout(() => {
          checkPixelStatus()
        }, 2000)
      } else {
        addLog('❌ Pixel代码加载失败: ' + pixelCode)
      }
    } catch (error) {
      addLog('❌ 加载Pixel代码出错: ' + (error as Error).message)
    }
  }

  // 检查Pixel状态
  const checkPixelStatus = () => {
    if (window.gtag) {
      addLog('✅ Google gtag已准备就绪')
    } else {
      addLog('⚠️ Google gtag未找到')
    }
    
    if (window.dataLayer) {
      addLog(`📊 dataLayer已初始化，当前条目: ${window.dataLayer.length}`)
    } else {
      addLog('⚠️ dataLayer未找到')
    }
    
    if (window.__googleAdsPixelLoaded) {
      addLog('✅ Google Ads Pixel已标记为已加载')
    } else {
      addLog('⚠️ Google Ads Pixel加载状态未知')
    }
  }

  // 添加日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConversionsSent(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }, [])

  // 设置Shopify Analytics模拟
  const setupShopifyAnalytics = useCallback(() => {
    const extendedWindow = window as unknown as ExtendedWindow
    
    // 清空之前的回调
    Object.keys(eventCallbacks).forEach(key => {
      eventCallbacks[key] = []
    })
    
    // 模拟 Shopify Analytics
    extendedWindow.Shopify = extendedWindow.Shopify || {}
    extendedWindow.Shopify.analytics = extendedWindow.Shopify.analytics || {
      subscribe: (event: string, callback: (data: unknown) => void) => {
        addLog(`📝 已订阅Shopify事件: ${event}`)
        if (!eventCallbacks[event]) {
          eventCallbacks[event] = []
        }
        eventCallbacks[event].push(callback)
      }
    }
    
    addLog('✅ Shopify Analytics环境已准备就绪')
  }, [addLog])

  useEffect(() => {
    setupShopifyAnalytics()
  }, [setupShopifyAnalytics])

  // 发送测试事件
  const sendTestEvent = () => {
    const transactionId = testData.transactionId || `test_${Date.now()}`
    setTestData(prev => ({ ...prev, transactionId }))

    const shopifyEventType = getShopifyEventType(testData.eventType)
    const callbacks = eventCallbacks[shopifyEventType] || []

    if (callbacks.length === 0) {
      addLog(`❌ 未找到 ${testData.eventType} (${shopifyEventType}) 事件的回调函数`)
      addLog(`📋 当前已注册的事件: ${Object.keys(eventCallbacks).join(', ')}`)
      addLog(`💡 请先加载Pixel代码以注册事件监听器`)
      return
    }

    let eventData
    switch (testData.eventType) {
      case 'purchase':
        eventData = {
          data: {
            checkout: {
              totalPrice: { amount: parseFloat(testData.value) },
              currencyCode: testData.currency,
              order: { id: transactionId },
              token: transactionId,
              email: 'test@example.com',
              phone: '+1234567890'
            }
          }
        }
        break
      case 'add_to_cart':
        eventData = {
          data: {
            productVariant: {
              id: testData.productId,
              title: '测试产品',
              price: { amount: parseFloat(testData.value), currencyCode: testData.currency },
              product: { type: '测试分类' }
            }
          }
        }
        break
      case 'begin_checkout':
        eventData = {
          data: {
            checkout: {
              totalPrice: { amount: parseFloat(testData.value) },
              currencyCode: testData.currency,
              lineItems: [{
                variant: {
                  id: testData.productId,
                  price: { amount: parseFloat(testData.value), currencyCode: testData.currency },
                  product: { type: '测试分类' }
                },
                title: '测试产品',
                quantity: 1
              }]
            }
          }
        }
        break
    }

    try {
      addLog(`🚀 准备发送${testData.eventType}事件到 ${callbacks.length} 个监听器`)
      
      callbacks.forEach((callback, index) => {
        try {
          callback(eventData)
          addLog(`✅ 回调函数 ${index + 1} 执行成功`)
        } catch (error) {
          addLog(`❌ 回调函数 ${index + 1} 执行失败: ${(error as Error).message}`)
        }
      })
      
      addLog(`📤 ${testData.eventType}测试事件发送完成`)
      addLog(`💰 金额: ${testData.value} ${testData.currency}`)
      addLog(`🆔 交易ID: ${transactionId}`)
      
      // 检查gtag调用
      setTimeout(() => {
        if (window.dataLayer && window.dataLayer.length > 0) {
          const lastEntry = window.dataLayer[window.dataLayer.length - 1]
          addLog(`📊 最新dataLayer条目: ${JSON.stringify(lastEntry)}`)
        }
      }, 100)
      
    } catch (error) {
      addLog(`❌ 发送事件失败: ${(error as Error).message}`)
    }
  }

  // 获取Shopify事件类型
  const getShopifyEventType = (eventType: string) => {
    const mapping: Record<string, string> = {
      'purchase': 'checkout_completed',
      'add_to_cart': 'product_added_to_cart',
      'begin_checkout': 'checkout_started'
    }
    return mapping[eventType] || eventType
  }

  // 检查Google Ads gtag
  const checkGtag = () => {
    if (window.gtag) {
      addLog('✅ Google gtag已加载')
      addLog(`📊 dataLayer长度: ${window.dataLayer?.length || 0}`)
    } else {
      addLog('❌ Google gtag未加载')
    }
  }

  // 清空日志
  const clearLogs = () => {
    setConversionsSent([])
  }

  const eventOptions = [
    { label: '购买转化 (Purchase)', value: 'purchase' },
    { label: '加购转化 (Add to Cart)', value: 'add_to_cart' },
    { label: '开始结账 (Begin Checkout)', value: 'begin_checkout' }
  ]

  return (
    <Page title="Google Ads转化测试工具">
      <Layout>
        <Layout.Section>
          <Banner title="Google Ads 转化追踪测试" tone="info">
            <p>此页面用于测试真实的Google Ads转化追踪功能。请按照以下步骤进行测试：</p>
            <ol>
              <li>点击&ldquo;加载Pixel代码&rdquo;按钮（会自动配置您的真实Google Ads设置）</li>
              <li>配置测试事件参数</li>
              <li>点击&ldquo;发送测试事件&rdquo;按钮</li>
              <li>查看控制台和日志输出验证事件发送</li>
              <li>在浏览器开发者工具Network面板中检查Google Analytics请求</li>
            </ol>
            <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              🎯 使用真实Google Ads配置: AW-11403892942 / zx0XCKPZic0ZEM6x5r0q
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">1. 环境准备</Text>
              <div style={{ margin: '16px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button onClick={setupRealConfig} variant="secondary">
                  配置Google Ads
                </Button>
                <Button onClick={loadPixelCode} variant="primary">
                  加载Pixel代码
                </Button>
                <Button onClick={checkPixelStatus}>
                  检查Pixel状态
                </Button>
                <Button onClick={checkGtag}>
                  检查Google gtag
                </Button>
              </div>
              <Text variant="bodyMd" tone="subdued" as="p">
                状态: {pixelLoaded ? '✅ Pixel已加载' : '⏳ 未加载'}
              </Text>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">2. 测试事件配置</Text>
              <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Select
                  label="事件类型"
                  options={eventOptions}
                  value={testData.eventType}
                  onChange={(value) => setTestData(prev => ({ ...prev, eventType: value }))}
                />
                <TextField
                  label="转化金额"
                  value={testData.value}
                  onChange={(value) => setTestData(prev => ({ ...prev, value }))}
                  autoComplete="off"
                />
                <TextField
                  label="货币代码"
                  value={testData.currency}
                  onChange={(value) => setTestData(prev => ({ ...prev, currency: value }))}
                  autoComplete="off"
                />
                <TextField
                  label="产品ID"
                  value={testData.productId}
                  onChange={(value) => setTestData(prev => ({ ...prev, productId: value }))}
                  autoComplete="off"
                />
              </div>
              <Button onClick={sendTestEvent} variant="primary" disabled={!pixelLoaded}>
                🚀 发送测试事件
              </Button>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Text variant="headingMd" as="h2">3. 测试日志</Text>
                <Button onClick={clearLogs} size="micro">清空</Button>
              </div>
              <div style={{ 
                backgroundColor: '#f6f6f7', 
                padding: '16px', 
                borderRadius: '8px', 
                fontFamily: 'monospace', 
                fontSize: '14px',
                height: '300px',
                overflow: 'auto'
              }}>
                {conversionsSent.length === 0 ? (
                  <Text tone="subdued" as="p">暂无日志...</Text>
                ) : (
                  conversionsSent.map((log, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">4. Google Ads验证</Text>
              <div style={{ margin: '16px 0' }}>
                <Text variant="bodyMd" as="p">
                  要验证转化是否真正发送到Google Ads，请：
                </Text>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>打开浏览器开发者工具 (F12)</li>
                  <li>切换到 Network 标签</li>
                  <li>筛选包含 google 的请求</li>
                  <li>发送测试事件后查看网络请求</li>
                  <li>检查是否有发送到 google-analytics.com 或 googleadservices.com 的请求</li>
                </ul>
              </div>
              <Banner title="重要提示" tone="warning">
                <p>要在Google Ads中看到转化数据，需要：</p>
                <ul>
                  <li>1. 使用真实的Google Ads转化ID (AW-xxxxxxxxx)</li>
                  <li>2. 在Google Ads后台创建对应的转化操作</li>
                  <li>3. 转化标签与后台配置一致</li>
                  <li>4. 等待24-48小时数据同步</li>
                </ul>
              </Banner>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
} 