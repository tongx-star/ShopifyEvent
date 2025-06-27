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
  Checkbox,
  Box,
  InlineCode
} from '@shopify/polaris'
import { ShopConfig, GoogleAdsConfig } from '@/lib/types'

interface ConfigFormProps {
  onConfigSaved: (configured: boolean) => void
}

export default function ConfigForm({ onConfigSaved }: ConfigFormProps) {
  const [config, setConfig] = useState<ShopConfig>({
    shop: '',
    googleAds: {
      conversionId: '',
      purchaseLabel: '',
      addToCartLabel: '',
      beginCheckoutLabel: '',
      enhancedConversions: false
    },
    updatedAt: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 获取商店参数
  const getShopParam = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('shop') || 'demo-shop.myshopify.com'
  }, [])

  // 加载现有配置
  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const shop = getShopParam()
      const response = await fetch(`/api/config?shop=${shop}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setConfig(data.data)
          onConfigSaved(true)
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }, [onConfigSaved, getShopParam])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const validateConfig = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!config.googleAds.conversionId) {
      newErrors.conversionId = '转化ID不能为空'
    } else if (!config.googleAds.conversionId.match(/^AW-\d+$/)) {
      newErrors.conversionId = '转化ID格式错误，应为 AW-xxxxxxxxx 格式'
    }
    
    if (!config.googleAds.purchaseLabel) {
      newErrors.purchaseLabel = '购买转化标签不能为空'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [config.googleAds.conversionId, config.googleAds.purchaseLabel])

  const handleSave = useCallback(async () => {
    if (!validateConfig()) {
      return
    }

    setSaving(true)
    try {
      const shop = getShopParam()
      const response = await fetch(`/api/config?shop=${shop}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleAds: config.googleAds
        }),
      })

      const data = await response.json()
      if (data.success) {
        setToastMessage('配置保存成功！请按照右侧指南启用Web Pixels扩展。')
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
  }, [config.googleAds, getShopParam, onConfigSaved, validateConfig])

  const handleChange = (field: string, value: string | boolean) => {
    if (field.startsWith('googleAds.')) {
      const adsField = field.replace('googleAds.', '') as keyof GoogleAdsConfig
      setConfig(prev => ({
        ...prev,
        googleAds: {
          ...prev.googleAds,
          [adsField]: value
        }
      }))
    }
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
          <Text as="p" variant="bodyMd">加载配置中...</Text>
        </div>
      </Card>
    )
  }

  const toast = showToast ? (
    <Toast 
      content={toastMessage} 
      onDismiss={() => setShowToast(false)}
      duration={5000}
    />
  ) : null

  return (
    <Frame>
      {toast}
      <Card>
        <div style={{ padding: '1rem' }}>
          <Text as="h2" variant="headingMd">Google Ads 转化追踪配置</Text>
          
          <Box paddingBlockStart="400">
            <Banner tone="info">
              <Text as="p">
                配置完成后，请在Shopify管理后台的&ldquo;设置 → 客户事件&rdquo;中添加 
                <InlineCode>Google Ads Conversion Tracking</InlineCode> 扩展，
                并在扩展设置中输入相同的配置信息。
              </Text>
            </Banner>
          </Box>

          <Box paddingBlockStart="500">
            <FormLayout>
              <TextField
                label="Google Ads 转化ID"
                value={config.googleAds.conversionId}
                onChange={(value) => handleChange('googleAds.conversionId', value)}
                error={errors.conversionId}
                helpText="格式：AW-123456789"
                placeholder="AW-123456789"
                autoComplete="off"
              />

              <TextField
                label="购买转化标签"
                value={config.googleAds.purchaseLabel}
                onChange={(value) => handleChange('googleAds.purchaseLabel', value)}
                error={errors.purchaseLabel}
                helpText="必填：用于追踪购买完成事件"
                placeholder="purchase_label_123"
                autoComplete="off"
              />

              <TextField
                label="加购物车转化标签（可选）"
                value={config.googleAds.addToCartLabel || ''}
                onChange={(value) => handleChange('googleAds.addToCartLabel', value)}
                helpText="用于追踪加购物车事件"
                placeholder="add_to_cart_label_123"
                autoComplete="off"
              />

              <TextField
                label="开始结账转化标签（可选）"
                value={config.googleAds.beginCheckoutLabel || ''}
                onChange={(value) => handleChange('googleAds.beginCheckoutLabel', value)}
                helpText="用于追踪开始结账事件"
                placeholder="begin_checkout_label_123"
                autoComplete="off"
              />

              <Checkbox
                label="启用增强转化"
                checked={config.googleAds.enhancedConversions || false}
                onChange={(value) => handleChange('googleAds.enhancedConversions', value)}
                helpText="包含客户邮箱、电话等信息以提高转化匹配精度"
              />

              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存配置'}
              </Button>
            </FormLayout>
          </Box>
        </div>
      </Card>
    </Frame>
  )
} 