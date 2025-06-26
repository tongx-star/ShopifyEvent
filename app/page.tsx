'use client'

import React, { useState } from 'react'
import {
  Layout,
  Card,
  Tabs,
  Page,
  Text,
  Banner
} from '@shopify/polaris'
import ConfigForm from '@/components/ConfigForm'
import EventMonitor from '@/components/EventMonitor'
import TestPanel from '@/components/TestPanel'

export default function Home() {
  const [selectedTab, setSelectedTab] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)

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
    },
    {
      id: 'test',
      content: '测试面板',
      accessibilityLabel: '转化事件测试',
      panelID: 'test-panel',
    },
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
      case 2:
        return <TestPanel isConfigured={isConfigured} />
      default:
        return <ConfigForm onConfigSaved={handleConfigSaved} />
    }
  }

  return (
    <Page 
      title="Google Ads Pixel"
      subtitle="Google Ads转化追踪插件"
    >
      <Layout>
        <Layout.Section>
          {!isConfigured && (
            <Banner tone="warning">
              <Text as="p">
                请先完成Google Ads转化追踪配置以开始使用所有功能。
              </Text>
            </Banner>
          )}

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
              <Text as="h3" variant="headingMd">快速指南</Text>
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">1. 配置Google Ads</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  在配置标签页中输入您的Google Ads转化ID和标签
                </Text>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">2. 监控事件</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  在事件监控页面查看实时的转化事件数据
                </Text>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Text as="h4" variant="headingSm">3. 测试验证</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  使用测试面板发送测试事件以验证配置
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
} 