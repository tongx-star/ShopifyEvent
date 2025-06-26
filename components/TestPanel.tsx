'use client'

import React, { useState } from 'react'
import {
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Select,
  Toast,
  Frame,
  Text
} from '@shopify/polaris'
import { EventData } from '@/lib/types'

interface TestPanelProps {
  isConfigured: boolean
}

export default function TestPanel({ isConfigured }: TestPanelProps) {
  const [eventType, setEventType] = useState('purchase')
  const [testData, setTestData] = useState<EventData>({
    value: 99.99,
    currency: 'USD',
    transaction_id: '',
    product_id: '',
    quantity: 1
  })
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState(false)

  const eventTypeOptions = [
    { label: '购买完成', value: 'purchase' },
    { label: '添加到购物车', value: 'add_to_cart' },
    { label: '开始结账', value: 'begin_checkout' }
  ]

  const handleTestDataChange = (field: keyof EventData) => (value: string) => {
    setTestData(prev => ({
      ...prev,
      [field]: field === 'value' || field === 'quantity' ? parseFloat(value) || 0 : value
    }))
  }

  const generateTestTransactionId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `test_${timestamp}_${random}`
  }

  const handleSendTestEvent = async () => {
    setLoading(true)
    
    try {
      // 如果没有交易ID，自动生成一个
      const finalTestData = {
        ...testData,
        transaction_id: testData.transaction_id || generateTestTransactionId()
      }

      const response = await fetch('/api/test-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          testData: finalTestData
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setToastMessage('测试事件发送成功！请在Google Ads中查看转化数据。')
        setToastError(false)
        setShowToast(true)
        
        // 更新交易ID显示
        setTestData(prev => ({
          ...prev,
          transaction_id: finalTestData.transaction_id
        }))
      } else {
        setToastMessage(data.error || '测试事件发送失败')
        setToastError(true)
        setShowToast(true)
      }
    } catch (error) {
      console.error('发送测试事件失败:', error)
      setToastMessage('网络错误，请稍后重试')
      setToastError(true)
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const resetTestData = () => {
    setTestData({
      value: 99.99,
      currency: 'USD',
      transaction_id: '',
      product_id: '',
      quantity: 1
    })
  }

  const generateSampleData = () => {
    const sampleData: Record<string, EventData> = {
      purchase: {
        value: 129.99,
        currency: 'USD',
        transaction_id: generateTestTransactionId(),
        product_id: 'sample_product_123',
        quantity: 2,
        items: [
          { item_id: 'item_1', item_name: '示例商品A', quantity: 1, price: 59.99 },
          { item_id: 'item_2', item_name: '示例商品B', quantity: 1, price: 69.99 }
        ]
      },
      add_to_cart: {
        value: 49.99,
        currency: 'USD',
        transaction_id: generateTestTransactionId(),
        product_id: 'sample_product_456',
        quantity: 1
      },
      begin_checkout: {
        value: 89.99,
        currency: 'USD',
        transaction_id: generateTestTransactionId(),
        product_id: 'sample_product_789',
        quantity: 1
      }
    }
    
    setTestData(sampleData[eventType] || sampleData.purchase)
  }

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setShowToast(false)}
      duration={4000}
    />
  ) : null

  if (!isConfigured) {
    return (
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Text as="h3" variant="headingMd">测试面板</Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            请先配置Google Ads转化追踪设置以开始测试
          </Text>
        </div>
      </Card>
    )
  }

  return (
    <Frame>
      <Card>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Text as="h3" variant="headingMd">转化事件测试</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              发送测试事件到Google Ads以验证转化追踪配置是否正常工作
            </Text>
          </div>

          <Banner tone="info">
            <Text as="p">
              • 测试事件将发送到您配置的Google Ads转化ID<br/>
              • 请在Google Ads中查看转化报告以确认数据接收<br/>
              • 建议在发布前进行充分测试以确保数据准确性
            </Text>
          </Banner>

          <FormLayout>
            <Select
              label="事件类型"
              options={eventTypeOptions}
              value={eventType}
              onChange={setEventType}
              helpText="选择要测试的转化事件类型"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <TextField
                label="转化金额"
                type="number"
                value={testData.value?.toString() || '0'}
                onChange={handleTestDataChange('value')}
                prefix="$"
                helpText="转化的金额值"
                autoComplete="off"
              />

              <Select
                label="货币"
                options={[
                  { label: 'USD - 美元', value: 'USD' },
                  { label: 'EUR - 欧元', value: 'EUR' },
                  { label: 'GBP - 英镑', value: 'GBP' },
                  { label: 'JPY - 日元', value: 'JPY' },
                  { label: 'CNY - 人民币', value: 'CNY' }
                ]}
                value={testData.currency || 'USD'}
                onChange={handleTestDataChange('currency')}
                helpText="转化的货币类型"
              />
            </div>

            <TextField
              label="交易ID"
              value={testData.transaction_id || ''}
              onChange={handleTestDataChange('transaction_id')}
              helpText="唯一的交易标识符（留空将自动生成）"
              autoComplete="off"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <TextField
                label="商品ID"
                value={testData.product_id || ''}
                onChange={handleTestDataChange('product_id')}
                helpText="相关商品的唯一标识符"
                autoComplete="off"
              />

              <TextField
                label="数量"
                type="number"
                value={testData.quantity?.toString() || '1'}
                onChange={handleTestDataChange('quantity')}
                helpText="商品数量"
                autoComplete="off"
              />
            </div>

            <TextField
              label="备注"
              value=""
              onChange={() => {}}
              helpText="可选的测试备注信息"
              autoComplete="off"
            />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button
                variant="primary"
                loading={loading}
                onClick={handleSendTestEvent}
                disabled={!eventType}
              >
                {loading ? '发送中...' : '发送测试事件'}
              </Button>
              
              <Button onClick={generateSampleData}>
                生成示例数据
              </Button>
              
              <Button onClick={resetTestData}>
                重置
              </Button>
            </div>
          </FormLayout>

          <div style={{ marginTop: '2rem' }}>
            <Banner tone="warning">
              <Text as="p">
                <strong>注意事项：</strong><br/>
                • 测试事件会计入您的Google Ads转化统计<br/>
                • 建议使用明显的测试标识符以便后续识别<br/>
                • 测试完成后可在Google Ads中删除测试数据
              </Text>
            </Banner>
          </div>
        </div>
      </Card>
      
      {toastMarkup}
    </Frame>
  )
} 