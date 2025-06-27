'use client'

import React, { useState } from 'react'
import {
  Layout,
  Card,
  Tabs,
  Page,
  Text,
  Banner,
  Button,
  Box,
  ButtonGroup,
  InlineCode
} from '@shopify/polaris'
import ConfigForm from '@/components/ConfigForm'
import EventMonitor from '@/components/EventMonitor'

export default function Home() {
  const [selectedTab, setSelectedTab] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)

  // 获取商店参数
  const getShopParam = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('shop') || 'demo-shop.myshopify.com'
    }
    return 'demo-shop.myshopify.com'
  }

  const tabs = [
    {
      id: 'config',
      content: '配置设置',
      accessibilityLabel: 'Google Ads配置设置',
      panelID: 'config-panel',
    },
    {
      id: 'monitor',
      content: '事件监控',
      accessibilityLabel: '转化事件监控',
      panelID: 'monitor-panel',
    }
  ]

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex)
  }

  const handleConfigSaved = (configured: boolean) => {
    setIsConfigured(configured)
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <ConfigForm onConfigSaved={handleConfigSaved} />
      case 1:
        return <EventMonitor isConfigured={isConfigured} />
      default:
        return <ConfigForm onConfigSaved={handleConfigSaved} />
    }
  }

  return (
    <Page 
      title="Google Ads 转化追踪"
      subtitle="基于Shopify Web Pixels API的现代化转化追踪解决方案"
      primaryAction={{
        content: '查看调试信息',
        url: `/api/debug?shop=${getShopParam()}`,
        external: true
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <Text as="p">
              此应用使用最新的 <InlineCode>Web Pixels API</InlineCode>，
              配置完成后请在Shopify管理后台的&ldquo;设置 → 客户事件&rdquo;中启用扩展。
            </Text>
          </Banner>

          <Card>
            <Tabs 
              tabs={tabs} 
              selected={selectedTab} 
              onSelect={handleTabChange}
            >
              <div style={{ padding: '1rem' }}>
                {renderTabContent()}
              </div>
            </Tabs>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text as="h3" variant="headingMd">设置指南</Text>
              
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">1. 配置转化追踪</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  在左侧配置页面输入您的Google Ads转化ID和转化标签
                </Text>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">2. 启用Web Pixels扩展</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  前往 Shopify管理后台 → 设置 → 客户事件 → 添加像素
                </Text>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">3. 配置扩展设置</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  在扩展设置中输入转化ID和标签，启用需要的事件追踪
                </Text>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">4. 监控转化数据</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  在事件监控页面查看实时转化事件，或在Google Ads后台查看转化数据
                </Text>
              </div>
              
              <Box paddingBlockStart="400">
                <Text as="h4" variant="headingSm">支持的事件</Text>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  <li><Text as="span" variant="bodyMd">购买完成 (checkout_completed)</Text></li>
                  <li><Text as="span" variant="bodyMd">加购物车 (product_added_to_cart)</Text></li>
                  <li><Text as="span" variant="bodyMd">开始结账 (checkout_started)</Text></li>
                </ul>
              </Box>
              
              <Box paddingBlockStart="400">
                <ButtonGroup>
                  <Button
                    url={`/api/debug?shop=${getShopParam()}`}
                    variant="secondary"
                    size="slim"
                    external
                  >
                    调试信息
                  </Button>
                </ButtonGroup>
              </Box>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
} 