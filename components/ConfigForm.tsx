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
  ButtonGroup,
  Box
} from '@shopify/polaris'
import { ShopConfig, GoogleAdsConfig } from '@/lib/types'

interface ConfigFormProps {
  onConfigSaved: (configured: boolean) => void
}

interface ScriptDetails {
  isInstalled: boolean
  installDetails?: {
    installedAt: string
    scriptSrc: string
  }
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
    enabledEvents: ['purchase']
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [checkingScript, setCheckingScript] = useState(false)
  const [scriptInstalled, setScriptInstalled] = useState(false)
  const [scriptDetails, setScriptDetails] = useState<ScriptDetails | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 获取商店参数
  const getShopParam = useCallback(() => {
    // 尝试从URL或其他地方获取shop参数
    const urlParams = new URLSearchParams(window.location.search)
    const shopParam = urlParams.get('shop')
    
    // 如果URL中没有，使用默认值（在实际应用中应该从会话或其他地方获取）
    return shopParam || 'xn-0zwm56daa.myshopify.com'
  }, [])

  // 检查Script Tag安装状态
  const checkScriptInstallation = useCallback(async () => {
    setCheckingScript(true)
    try {
      const shop = getShopParam()
      const response = await fetch(`/api/install-script?shop=${shop}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setScriptInstalled(data.data.isInstalled)
          setScriptDetails(data.data)
        }
      }
    } catch (error) {
      console.error('检查Script安装状态失败:', error)
    } finally {
      setCheckingScript(false)
    }
  }, [getShopParam])

  // 安装Script Tag
  const installScript = useCallback(async () => {
    if (!config.googleAds.conversionId) {
      setToastMessage('请先保存Google Ads配置，然后再安装追踪脚本')
      setShowToast(true)
      return
    }

    setInstalling(true)
    try {
      const shop = getShopParam()
      const response = await fetch(`/api/install-script?shop=${shop}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setToastMessage('Google Ads追踪脚本安装成功！现在可以开始追踪转化数据。')
        setShowToast(true)
        setScriptInstalled(true)
        setScriptDetails(data.data)
        if (typeof onConfigSaved === 'function') {
          onConfigSaved(true)
        }
      } else {
        setToastMessage(data.error || '安装失败，请重试')
        setShowToast(true)
      }
    } catch (error) {
      console.error('安装Script失败:', error)
      setToastMessage('安装失败，请检查网络连接和应用权限')
      setShowToast(true)
    } finally {
      setInstalling(false)
    }
  }, [config.googleAds.conversionId, getShopParam, onConfigSaved])

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
      
      // 同时检查Script安装状态
      await checkScriptInstallation()
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }, [onConfigSaved, getShopParam, checkScriptInstallation])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const validateConfig = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    // 验证转化ID格式
    if (!config.googleAds.conversionId) {
      newErrors.conversionId = '转化ID不能为空'
    } else if (!config.googleAds.conversionId.match(/^AW-\d+$/)) {
      newErrors.conversionId = '转化ID格式错误，应为 AW-xxxxxxxxx 格式'
    }
    
    // 验证购买标签（必需）
    if (!config.googleAds.purchaseLabel) {
      newErrors.purchaseLabel = '购买转化标签不能为空'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [config.googleAds.conversionId, config.googleAds.purchaseLabel])

  const getEnabledEvents = useCallback((): string[] => {
    const events = ['purchase'] // 购买事件始终启用
    if (config.googleAds.addToCartLabel) events.push('add_to_cart')
    if (config.googleAds.beginCheckoutLabel) events.push('begin_checkout')
    return events
  }, [config.googleAds.addToCartLabel, config.googleAds.beginCheckoutLabel])

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
          googleAds: config.googleAds,
          enabledEvents: getEnabledEvents()
        }),
      })

      const data = await response.json()
      if (data.success) {
        setToastMessage('配置保存成功！现在可以安装追踪脚本。')
        setShowToast(true)
        onConfigSaved(true)
        
        // 重新检查Script安装状态
        await checkScriptInstallation()
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
  }, [config, onConfigSaved, validateConfig, getEnabledEvents, getShopParam, checkScriptInstallation])

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
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
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

  const renderScriptStatus = () => {
    if (checkingScript) {
      return (
        <Banner tone="info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Spinner size="small" />
            <Text as="span">正在检查追踪脚本安装状态...</Text>
          </div>
        </Banner>
      )
    }

    if (scriptInstalled) {
      return (
        <Banner tone="success">
          <Text as="p">
            ✅ <strong>追踪脚本已安装</strong><br/>
            Google Ads追踪代码已成功安装到您的商店中。转化事件将自动发送到Google Ads。
            {scriptDetails?.installDetails?.installedAt && (
              <><br/>安装时间: {new Date(scriptDetails.installDetails.installedAt).toLocaleString()}</>
            )}
          </Text>
        </Banner>
      )
    } else if (config.googleAds.conversionId) {
      return (
        <Banner tone="warning">
          <Text as="p">
            ⚠️ <strong>追踪脚本未安装</strong><br/>
            您的Google Ads配置已保存，但追踪脚本尚未安装到商店前端。<br/>
            请点击下方的&ldquo;安装追踪脚本&rdquo;按钮完成设置。
          </Text>
        </Banner>
      )
    } else {
      return (
        <Banner tone="info">
          <Text as="p">
            💡 <strong>配置提示</strong><br/>
            请先配置并保存Google Ads设置，然后安装追踪脚本到您的商店。
          </Text>
        </Banner>
      )
    }
  }

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

        {/* Script安装状态 */}
        <div style={{ padding: '1rem', marginBottom: '1rem' }}>
          {renderScriptStatus()}
        </div>

        <div style={{ padding: '1rem' }}>
          <FormLayout>
            <TextField
              label="Google Ads转化ID"
              value={config.googleAds.conversionId}
              onChange={(value) => handleChange('googleAds.conversionId', value)}
              error={errors.conversionId}
              placeholder="AW-1140389242"
              helpText="在Google Ads中找到您的转化ID，格式为 AW-xxxxxxxxx"
              autoComplete="off"
              requiredIndicator
            />

            <TextField
              label="购买转化标签"
              value={config.googleAds.purchaseLabel}
              onChange={(value) => handleChange('googleAds.purchaseLabel', value)}
              error={errors.purchaseLabel}
              placeholder="zx0XCKPZic0ZEM6x5r0q"
              helpText="当客户完成购买时触发的转化标签"
              autoComplete="off"
              requiredIndicator
            />

            <TextField
              label="加购转化标签（可选）"
              value={config.googleAds.addToCartLabel || ''}
              onChange={(value) => handleChange('googleAds.addToCartLabel', value)}
              placeholder="zx0XCKPZic0ZEM6x5r0q"
              helpText="当客户添加商品到购物车时触发的转化标签"
              autoComplete="off"
            />

            <TextField
              label="开始结账转化标签（可选）"
              value={config.googleAds.beginCheckoutLabel || ''}
              onChange={(value) => handleChange('googleAds.beginCheckoutLabel', value)}
              placeholder="conversion_label_here"
              helpText="当客户开始结账流程时触发的转化标签"
              autoComplete="off"
            />

            <Checkbox
              label="启用增强转化"
              checked={config.googleAds.enhancedConversions || false}
              onChange={(value) => handleChange('googleAds.enhancedConversions', value)}
              helpText="启用后将发送更详细的转化数据以提高追踪准确性"
            />

            <div style={{ marginTop: '1rem' }}>
              <Banner tone="info">
                <Text as="p">
                  • 转化ID和购买标签是必需的，其他标签为可选配置<br/>
                  • 配置完成后需要手动安装追踪脚本到商店前端<br/>
                  • 建议在Google Ads中测试转化是否正常工作
                </Text>
              </Banner>
            </div>

            <Box paddingBlockStart="400">
              <ButtonGroup>
                <Button
                  variant="primary"
                  loading={saving}
                  onClick={handleSave}
                  disabled={!config.googleAds.conversionId || !config.googleAds.purchaseLabel}
                >
                  {saving ? '保存中...' : '保存配置'}
                </Button>
                
                <Button
                  onClick={loadConfig}
                  disabled={loading || saving}
                >
                  重新加载
                </Button>

                {config.googleAds.conversionId && !scriptInstalled && (
                  <Button
                    variant="secondary"
                    tone="success"
                    loading={installing}
                    onClick={installScript}
                    disabled={saving || installing}
                  >
                    {installing ? '安装中...' : '安装追踪脚本'}
                  </Button>
                )}

                {scriptInstalled && (
                  <Button
                    variant="secondary"
                    onClick={checkScriptInstallation}
                    loading={checkingScript}
                    disabled={checkingScript}
                  >
                    {checkingScript ? '检查中...' : '检查安装状态'}
                  </Button>
                )}
              </ButtonGroup>
            </Box>
          </FormLayout>
        </div>
      </Card>
      
      {toastMarkup}
    </Frame>
  )
} 