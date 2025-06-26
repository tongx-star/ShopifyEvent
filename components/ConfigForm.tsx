'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Toast,
  Frame,
  Spinner,
  Text,
  Checkbox
} from '@shopify/polaris'
import { GoogleAdsConfig } from '@/lib/types'

interface ConfigFormProps {
  onConfigSaved: (configured: boolean) => void
}

export default function ConfigForm({ onConfigSaved }: ConfigFormProps) {
  const [config, setConfig] = useState<GoogleAdsConfig>({
    conversionId: '',
    purchaseLabel: '',
    addToCartLabel: '',
    beginCheckoutLabel: '',
    enhancedConversions: false
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 加载现有配置
  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setConfig(data.data.googleAds)
          onConfigSaved(true)
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }, [onConfigSaved])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const validateConfig = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    // 验证转化ID格式
    if (!config.conversionId) {
      newErrors.conversionId = '转化ID不能为空'
    } else if (!config.conversionId.match(/^AW-\d+$/)) {
      newErrors.conversionId = '转化ID格式错误，应为 AW-xxxxxxxxx 格式'
    }
    
    // 验证购买标签（必需）
    if (!config.purchaseLabel) {
      newErrors.purchaseLabel = '购买转化标签不能为空'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [config.conversionId, config.purchaseLabel])

  const getEnabledEvents = useCallback((): string[] => {
    const events = ['purchase'] // 购买事件始终启用
    if (config.addToCartLabel) events.push('add_to_cart')
    if (config.beginCheckoutLabel) events.push('begin_checkout')
    return events
  }, [config.addToCartLabel, config.beginCheckoutLabel])

  const handleSave = useCallback(async () => {
    if (!validateConfig()) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleAds: config,
          enabledEvents: getEnabledEvents()
        }),
      })

      const data = await response.json()
      if (data.success) {
        setToastMessage('配置保存成功！转化追踪已启用。')
        setShowToast(true)
        onConfigSaved(true)
      } else {
        setToastMessage(data.error || '保存失败，请重试')
        setShowToast(true)
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      setToastMessage('保存失败，请检查网络连接')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }, [config, onConfigSaved, validateConfig, getEnabledEvents])

  const handleFieldChange = (field: keyof GoogleAdsConfig) => (value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setShowToast(false)}
      duration={4000}
    />
  ) : null

  if (loading) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner size="large" />
        </div>
      </Card>
    )
  }

  return (
    <Frame>
      <Card>
        <div style={{ padding: '1rem', marginBottom: '1rem' }}>
          <Text as="h2" variant="headingMd">Google Ads转化追踪配置</Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            配置您的Google Ads转化ID和标签以开始追踪转化事件
          </Text>
        </div>

        <div style={{ padding: '1rem' }}>
          <FormLayout>
            <TextField
              label="Google Ads转化ID"
              value={config.conversionId}
              onChange={handleFieldChange('conversionId')}
              error={errors.conversionId}
              placeholder="AW-123456789"
              helpText="在Google Ads中找到您的转化ID，格式为 AW-xxxxxxxxx"
              autoComplete="off"
              requiredIndicator
            />

            <TextField
              label="购买转化标签"
              value={config.purchaseLabel}
              onChange={handleFieldChange('purchaseLabel')}
              error={errors.purchaseLabel}
              placeholder="purchase_conversion"
              helpText="当客户完成购买时触发的转化标签"
              autoComplete="off"
              requiredIndicator
            />

            <TextField
              label="加购转化标签（可选）"
              value={config.addToCartLabel || ''}
              onChange={handleFieldChange('addToCartLabel')}
              placeholder="add_to_cart_conversion"
              helpText="当客户添加商品到购物车时触发的转化标签"
              autoComplete="off"
            />

            <TextField
              label="开始结账转化标签（可选）"
              value={config.beginCheckoutLabel || ''}
              onChange={handleFieldChange('beginCheckoutLabel')}
              placeholder="begin_checkout_conversion"
              helpText="当客户开始结账流程时触发的转化标签"
              autoComplete="off"
            />

            <Checkbox
              label="启用增强转化"
              checked={config.enhancedConversions || false}
              onChange={handleFieldChange('enhancedConversions')}
              helpText="启用后将发送更详细的转化数据以提高追踪准确性"
            />

            <div style={{ marginTop: '1rem' }}>
              <Banner tone="info">
                <Text as="p">
                  • 转化ID和购买标签是必需的，其他标签为可选配置<br/>
                  • 保存后将自动在您的商店中安装转化追踪代码<br/>
                  • 建议在Google Ads中测试转化是否正常工作
                </Text>
              </Banner>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button
                variant="primary"
                loading={saving}
                onClick={handleSave}
                disabled={!config.conversionId || !config.purchaseLabel}
              >
                {saving ? '保存中...' : '保存配置'}
              </Button>
              
              <Button
                onClick={loadConfig}
                disabled={loading || saving}
              >
                重新加载
              </Button>
            </div>
          </FormLayout>
        </div>
      </Card>
      
      {toastMarkup}
    </Frame>
  )
} 