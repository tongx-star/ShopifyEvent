'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  DataTable,
  Badge,
  Text,
  Banner,
  Button,
  Filters,
  EmptySearchResult,
  Spinner
} from '@shopify/polaris'
import { ConversionEvent, EventStats } from '@/lib/types'

interface EventMonitorProps {
  isConfigured: boolean
}

export default function EventMonitor({ isConfigured }: EventMonitorProps) {
  const [events, setEvents] = useState<ConversionEvent[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedEventType, setSelectedEventType] = useState<string>('')

  useEffect(() => {
    if (isConfigured) {
      loadEvents()
      loadStats()
    }
  }, [isConfigured])

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.data || [])
        setError('')
      } else {
        setError(data.error || '加载事件失败')
      }
    } catch (error) {
      console.error('加载事件失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/events', { method: 'PUT' })
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const formatCurrency = (value: number | undefined, currency: string | undefined): string => {
    if (!value) return '-'
    return `${value.toFixed(2)} ${currency || 'USD'}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge tone="success">成功</Badge>
      case 'failed':
        return <Badge tone="critical">失败</Badge>
      case 'pending':
        return <Badge tone="warning">处理中</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getEventTypeText = (eventType: string): string => {
    switch (eventType) {
      case 'purchase':
        return '购买完成'
      case 'add_to_cart':
        return '添加到购物车'
      case 'begin_checkout':
        return '开始结账'
      default:
        return eventType
    }
  }

  const filteredEvents = selectedEventType
    ? events.filter(event => event.eventType === selectedEventType)
    : events

  const eventTypeOptions = [
    { label: '所有事件', value: '' },
    { label: '购买完成', value: 'purchase' },
    { label: '添加到购物车', value: 'add_to_cart' },
    { label: '开始结账', value: 'begin_checkout' }
  ]

  const filters = [
    {
      key: 'eventType',
      label: '事件类型',
      filter: (
        <div>
          {eventTypeOptions.map(option => (
            <Button
              key={option.value}
              pressed={selectedEventType === option.value}
              onClick={() => setSelectedEventType(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )
    }
  ]

  if (!isConfigured) {
    return (
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Text as="h3" variant="headingMd">事件监控</Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            请先配置Google Ads转化追踪设置以开始监控事件
          </Text>
        </div>
      </Card>
    )
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

  if (error) {
    return (
      <Card>
        <Banner tone="critical">
          <Text as="p">{error}</Text>
          <Button onClick={loadEvents}>重试</Button>
        </Banner>
      </Card>
    )
  }

  const rows = filteredEvents.map(event => [
    getEventTypeText(event.eventType),
    formatTimestamp(event.timestamp),
    formatCurrency(event.value, event.currency),
    event.transactionId || '-',
    getStatusBadge(event.status)
  ])

  const headings = [
    '事件类型',
    '时间',
    '金额',
    '交易ID',
    '状态'
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 统计卡片 */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Card>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <Text as="h3" variant="headingLg">{stats.totalEvents}</Text>
              <Text as="p" variant="bodyMd" tone="subdued">总事件数</Text>
            </div>
          </Card>
          <Card>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <Text as="h3" variant="headingLg">{stats.purchaseEvents}</Text>
              <Text as="p" variant="bodyMd" tone="subdued">购买事件</Text>
            </div>
          </Card>
          <Card>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <Text as="h3" variant="headingLg">{stats.addToCartEvents}</Text>
              <Text as="p" variant="bodyMd" tone="subdued">加购事件</Text>
            </div>
          </Card>
          <Card>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <Text as="h3" variant="headingLg">{stats.beginCheckoutEvents}</Text>
              <Text as="p" variant="bodyMd" tone="subdued">结账事件</Text>
            </div>
          </Card>
        </div>
      )}

      {/* 事件列表 */}
      <Card>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Text as="h3" variant="headingMd">转化事件记录</Text>
            <Button onClick={loadEvents}>刷新</Button>
          </div>

          {filteredEvents.length > 0 && (
            <Banner tone="info">
              <Text as="p">共找到 {filteredEvents.length} 个事件</Text>
            </Banner>
          )}

          <div style={{ marginTop: '1rem' }}>
            <Filters
              queryValue=""
              filters={filters}
              onQueryChange={() => {}}
              onQueryClear={() => {}}
              onClearAll={() => setSelectedEventType('')}
            />
          </div>

          {filteredEvents.length === 0 ? (
            <EmptySearchResult
              title="暂无事件记录"
              description="当有转化事件发生时，它们将显示在这里"
              withIllustration
            />
          ) : (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={headings}
              rows={rows}
            />
          )}
        </div>
      </Card>
    </div>
  )
} 