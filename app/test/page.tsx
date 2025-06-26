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

  // 自动配置测试环境
  const setupTestConfig = async () => {
    try {
      addLog('⚙️ 正在配置测试环境...')
      
      const configData = {
        googleAds: {
          conversionId: "AW-123456789",
          purchaseLabel: `test_purchase_${Date.now()}`,
          addToCartLabel: `test_add_to_cart_${Date.now()}`,
          beginCheckoutLabel: `test_begin_checkout_${Date.now()}`
        },
        enabledEvents: ["purchase", "add_to_cart", "begin_checkout"]
      }
      
      const response = await fetch(`/api/config?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })
      
      const result = await response.json()
      if (result.success) {
        addLog('✅ 测试配置设置成功')
        addLog(`📋 转化ID: ${result.data.googleAds.conversionId}`)
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
      // 先检查是否有配置，如果没有则自动配置
      const checkResponse = await fetch(`/api/config?shop=${shop}`)
      const checkResult = await checkResponse.json()
      
      if (!checkResult.success || !checkResult.data.googleAds?.conversionId) {
        addLog('⚠️ 未发现配置，开始自动配置...')
        const configSuccess = await setupTestConfig()
        if (!configSuccess) {
          return
        }
      } else {
        addLog('✅ 发现已有配置')
      }
      
      const response = await fetch(`/api/pixel?shop=${shop}`)
      const pixelCode = await response.text()
      
      if (response.ok) {
        // 创建script标签并执行Pixel代码
        const script = document.createElement('script')
        script.textContent = pixelCode
        document.head.appendChild(script)
        
        setPixelLoaded(true)
        addLog('✅ Pixel代码加载成功')
      } else {
        addLog('❌ Pixel代码加载失败: ' + pixelCode)
      }
    } catch (error) {
      addLog('❌ 加载Pixel代码出错: ' + (error as Error).message)
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
    
    // 模拟 Shopify Analytics
    extendedWindow.Shopify = extendedWindow.Shopify || {}
    extendedWindow.Shopify.analytics = extendedWindow.Shopify.analytics || {
      subscribe: (event: string, callback: (data: unknown) => void) => {
        addLog(`📝 已订阅事件: ${event}`)
        extendedWindow[`__shopify_${event}_callback`] = callback
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

    let eventData
    const callbackKey = `shopify_${getShopifyEventType(testData.eventType)}_callback`
    const callback = (window as unknown as ExtendedWindow)[callbackKey] as ((data: unknown) => void) | undefined

    if (!callback) {
      addLog(`❌ 未找到 ${testData.eventType} 事件的回调函数，请先加载Pixel代码`)
      return
    }

    switch (testData.eventType) {
      case 'purchase':
        eventData = {
          data: {
            checkout: {
              totalPrice: { amount: testData.value },
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
              price: { amount: testData.value, currencyCode: testData.currency },
              product: { type: '测试分类' }
            }
          }
        }
        break
      case 'begin_checkout':
        eventData = {
          data: {
            checkout: {
              totalPrice: { amount: testData.value },
              currencyCode: testData.currency,
              lineItems: [{
                variant: {
                  id: testData.productId,
                  price: { amount: testData.value, currencyCode: testData.currency },
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
      callback(eventData)
      addLog(`📤 发送${testData.eventType}测试事件成功`)
      addLog(`💰 金额: ${testData.value} ${testData.currency}`)
      addLog(`🆔 交易ID: ${transactionId}`)
      
      // 记录到服务器
      recordToServer()
    } catch (error) {
      addLog(`❌ 发送事件失败: ${(error as Error).message}`)
    }
  }

  // 记录事件到服务器
  const recordToServer = async () => {
    try {
      const response = await fetch(`/api/events?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: testData.eventType,
          value: parseFloat(testData.value),
          currency: testData.currency,
          transactionId: testData.transactionId,
          productId: testData.productId,
          data: { test: true, timestamp: new Date().toISOString() }
        })
      })
      
      const result = await response.json()
      if (result.success) {
        addLog('✅ 事件已记录到服务器')
      } else {
        addLog('❌ 服务器记录失败: ' + result.error)
      }
    } catch (error) {
      addLog('❌ 服务器通信失败: ' + (error as Error).message)
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

  // 获取事件统计
  const getEventStats = async () => {
    try {
      const response = await fetch(`/api/events?shop=${shop}`, { method: 'PUT' })
      const result = await response.json()
      if (result.success) {
        addLog(`📊 事件统计: 总计${result.data.totalEvents}, 购买${result.data.purchaseEvents}, 加购${result.data.addToCartEvents}`)
      }
    } catch (error) {
      addLog('❌ 获取统计失败: ' + (error as Error).message)
    }
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
          <Banner title="测试说明" tone="info">
            <p>此页面用于测试Google Ads转化追踪功能。请按照以下步骤进行测试：</p>
            <ol>
              <li>点击加载Pixel代码按钮（会自动配置测试环境）</li>
              <li>配置测试事件参数</li>
              <li>点击发送测试事件按钮</li>
              <li>查看控制台和日志输出</li>
              <li>在浏览器开发者工具中验证网络请求</li>
            </ol>
            <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              💡 提示：如果是首次使用，系统会自动配置测试用的Google Ads设置
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <Text variant="headingMd" as="h2">1. 环境准备</Text>
              <div style={{ margin: '16px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button onClick={setupTestConfig} variant="secondary">
                  配置测试环境
                </Button>
                <Button onClick={loadPixelCode} variant="primary">
                  加载Pixel代码
                </Button>
                <Button onClick={checkGtag}>
                  检查Google gtag
                </Button>
                <Button onClick={getEventStats}>
                  获取事件统计
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