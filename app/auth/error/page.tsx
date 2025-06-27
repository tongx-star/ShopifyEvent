'use client'

import React, { Suspense } from 'react'
import { Card, Page, Text, Button, Banner, Box, Spinner } from '@shopify/polaris'
import { useSearchParams } from 'next/navigation'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || '认证过程中发生未知错误'

  const handleRetry = () => {
    // 重定向到应用主页或重新开始认证流程
    window.location.href = '/'
  }

  return (
    <Card>
      <Box padding="400">
        <Banner tone="critical">
          <Text as="h2" variant="headingMd">
            应用认证失败
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodyMd">
              {decodeURIComponent(message)}
            </Text>
          </Box>
        </Banner>
        
        <Box paddingBlockStart="400">
          <Text as="p" variant="bodyMd" tone="subdued">
            这可能是由以下原因造成的：
          </Text>
          <Box paddingBlockStart="200">
            <ul style={{ paddingLeft: '20px' }}>
              <li>商店域名格式不正确</li>
              <li>授权过程被中断</li>
              <li>应用配置错误</li>
              <li>网络连接问题</li>
            </ul>
          </Box>
        </Box>

        <Box paddingBlockStart="400">
          <Button
            variant="primary"
            onClick={handleRetry}
          >
            重新尝试
          </Button>
        </Box>
      </Box>
    </Card>
  )
}

export default function AuthError() {
  return (
    <Page title="认证错误">
      <Suspense fallback={
        <Card>
          <Box padding="400">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Spinner size="large" />
            </div>
          </Box>
        </Card>
      }>
        <AuthErrorContent />
      </Suspense>
    </Page>
  )
} 