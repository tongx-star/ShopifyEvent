import { ShopConfig, ShopifySession, ConversionEvent, EventStats } from './types'

// KV 存储接口定义
interface KVStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  lpush(key: string, value: unknown): Promise<unknown>;
  lrange(key: string, start: number, end: number): Promise<unknown[]>;
  ltrim(key: string, start: number, end: number): Promise<unknown>;
  llen(key: string): Promise<number>;
  exists(key: string): Promise<number>;
}

// 在开发环境中使用内存存储，生产环境使用 Vercel KV
let kvStore: KVStore;

async function initKvStore(): Promise<KVStore> {
  if (process.env.NODE_ENV === 'development' || !process.env.KV_REST_API_URL) {
    // 开发环境使用内存存储
    const { devKV } = await import('./dev-storage');
    return devKV;
  } else {
    // 生产环境使用 Vercel KV
    const { kv } = await import('@vercel/kv');
    return kv;
  }
}

// 初始化存储
const kvStorePromise = initKvStore();

async function getKvStore(): Promise<KVStore> {
  if (!kvStore) {
    kvStore = await kvStorePromise;
  }
  return kvStore;
}

/**
 * 数据存储工具类
 * 提供统一的数据存储接口，基于Vercel KV
 */
export class Storage {
  
  // 商店配置存储
  static async setShopConfig(shop: string, config: ShopConfig): Promise<void> {
    const key = `shop:${shop}:config`
    const kv = await getKvStore()
    await kv.set(key, {
      ...config,
      updatedAt: new Date().toISOString()
    })
  }

  static async getShopConfig(shop: string): Promise<ShopConfig | null> {
    const key = `shop:${shop}:config`
    const kv = await getKvStore()
    return await kv.get<ShopConfig>(key)
  }

  // 会话存储
  static async setSession(sessionId: string, sessionData: Record<string, unknown>): Promise<void> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    await kv.set(key, sessionData, { ex: 3600 }) // 1小时过期
  }

  static async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    return await kv.get<Record<string, unknown>>(key)
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    await kv.del(key)
  }

  // 事件存储
  static async addEvent(shop: string, event: ConversionEvent): Promise<void> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    await kv.lpush(key, event)
    
    // 保持列表大小
    await kv.ltrim(key, 0, 999) // 保留最近1000条事件
  }

  static async getEvents(shop: string, limit: number = 100): Promise<ConversionEvent[]> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    const events = await kv.lrange(key, 0, limit - 1)
    // 安全地转换类型，先转为unknown再转为目标类型
    return (events as unknown as ConversionEvent[]) || []
  }

  static async getEventsByDateRange(
    shop: string, 
    startDate: string, 
    endDate: string
  ): Promise<ConversionEvent[]> {
    const events = await this.getEvents(shop, 1000)
    return events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= new Date(startDate) && eventDate <= new Date(endDate)
    })
  }

  // 统计数据存储
  static async updateStats(shop: string, eventType: string, value: number = 1): Promise<void> {
    const key = `shop:${shop}:stats`
    const kv = await getKvStore()
    const stats = await kv.get<EventStats>(key) as EventStats | null
    const defaultStats: EventStats = {
      totalEvents: 0,
      purchaseEvents: 0,
      addToCartEvents: 0,
      beginCheckoutEvents: 0,
      lastUpdated: new Date().toISOString()
    }

    const currentStats = stats || defaultStats
    const updatedStats: EventStats = {
      ...currentStats,
      totalEvents: currentStats.totalEvents + value,
      lastUpdated: new Date().toISOString()
    }

    // 更新特定事件类型的计数
    switch (eventType) {
      case 'purchase':
        updatedStats.purchaseEvents = currentStats.purchaseEvents + value
        break
      case 'add_to_cart':
        updatedStats.addToCartEvents = currentStats.addToCartEvents + value
        break
      case 'begin_checkout':
        updatedStats.beginCheckoutEvents = currentStats.beginCheckoutEvents + value
        break
    }

    await kv.set(key, updatedStats)
  }

  static async getStats(shop: string): Promise<EventStats> {
    const key = `shop:${shop}:stats`
    const kv = await getKvStore()
    const stats = await kv.get<EventStats>(key)
    
    return stats || {
      totalEvents: 0,
      purchaseEvents: 0,
      addToCartEvents: 0,
      beginCheckoutEvents: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  // 缓存管理
  static async setCache(key: string, data: unknown, ttl: number = 300): Promise<void> {
    const kv = await getKvStore()
    await kv.set(`cache:${key}`, data, { ex: ttl })
  }

  static async getCache<T = unknown>(key: string): Promise<T | null> {
    const kv = await getKvStore()
    return await kv.get<T>(`cache:${key}`)
  }

  static async deleteCache(key: string): Promise<void> {
    const kv = await getKvStore()
    await kv.del(`cache:${key}`)
  }

  // 访问日志
  static async logAccess(shop: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const logEntry = {
      shop,
      action,
      timestamp: new Date().toISOString(),
      metadata
    }
    
    const key = `shop:${shop}:access_log`
    const kv = await getKvStore()
    await kv.lpush(key, logEntry)
    
    // 保持日志大小
    await kv.ltrim(key, 0, 99) // 保留最近100条日志
  }

  static async getAccessLogs(shop: string, limit: number = 50): Promise<Record<string, unknown>[]> {
    const key = `shop:${shop}:access_log`
    const kv = await getKvStore()
    const logs = await kv.lrange(key, 0, limit - 1)
    // 安全地转换类型，先转为unknown再转为目标类型
    return (logs as unknown as Record<string, unknown>[]) || []
  }

  // 数据清理工具
  static async cleanupExpiredData(): Promise<void> {
    // 这里可以实现定期清理过期数据的逻辑
    console.log('清理过期数据...')
  }

  // 批量操作
  static async bulkSetEvents(shop: string, events: ConversionEvent[]): Promise<void> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    
    for (const event of events) {
      await kv.lpush(key, event)
    }
    
    // 保持列表大小
    await kv.ltrim(key, 0, 999)
  }

  static async exportShopData(shop: string): Promise<{
    config: ShopConfig | null;
    events: ConversionEvent[];
    stats: EventStats;
    accessLogs: Record<string, unknown>[];
  }> {
    const [config, events, stats, accessLogs] = await Promise.all([
      this.getShopConfig(shop),
      this.getEvents(shop, 1000),
      this.getStats(shop),
      this.getAccessLogs(shop, 100)
    ])

    return {
      config,
      events,
      stats,
      accessLogs
    }
  }
}

// 商店配置存储
export class ShopConfigStorage {
  static async save(shop: string, config: ShopConfig): Promise<void> {
    const key = `shop:${shop}:config`
    const kv = await getKvStore()
    await kv.set(key, {
      ...config,
      updatedAt: new Date().toISOString()
    })
  }

  static async get(shop: string): Promise<ShopConfig | null> {
    const key = `shop:${shop}:config`
    const kv = await getKvStore()
    return await kv.get<ShopConfig>(key)
  }

  static async delete(shop: string): Promise<void> {
    const key = `shop:${shop}:config`
    const kv = await getKvStore()
    await kv.del(key)
  }

  static async exists(shop: string): Promise<boolean> {
    const config = await this.get(shop)
    return config !== null
  }
}

// Shopify会话存储
export class SessionStorage {
  static async save(sessionId: string, session: ShopifySession): Promise<void> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    await kv.set(key, session, { ex: 3600 }) // 1小时过期
  }

  static async get(sessionId: string): Promise<ShopifySession | null> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    return await kv.get<ShopifySession>(key)
  }

  static async delete(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    await kv.del(key)
  }

  static async getByShop(shop: string): Promise<ShopifySession | null> {
    // 这里简化处理
    const sessionKey = `shop_session:${shop}`
    const kv = await getKvStore()
    const sessionId = await kv.get<string>(sessionKey)
    
    if (sessionId) {
      return await this.get(sessionId)
    }
    
    return null
  }
}

// 事件存储
export class EventStorage {
  static async addEvent(shop: string, event: Record<string, unknown>): Promise<void> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    await kv.lpush(key, event)
    // 保持列表大小，只保留最近1000条
    await kv.ltrim(key, 0, 999)
  }

  static async getEvents(shop: string, limit = 100): Promise<Record<string, unknown>[]> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    const events = await kv.lrange(key, 0, limit - 1)
    return (events as unknown as Record<string, unknown>[]) || []
  }

  static async getEventCount(shop: string): Promise<number> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    return await kv.llen(key)
  }

  static async clearEvents(shop: string): Promise<void> {
    const key = `shop:${shop}:events`
    const kv = await getKvStore()
    await kv.del(key)
  }
}

// 统计数据存储
export class StatsStorage {
  static async updateStats(shop: string, eventType: string, value = 1): Promise<void> {
    const key = `shop:${shop}:stats`
    const kv = await getKvStore()
    const stats = await kv.get<EventStats>(key) || {
      totalEvents: 0,
      purchaseEvents: 0,
      addToCartEvents: 0,
      beginCheckoutEvents: 0,
      lastUpdated: new Date().toISOString()
    }

    const updatedStats = {
      ...stats,
      totalEvents: stats.totalEvents + value,
      lastUpdated: new Date().toISOString()
    }

    switch (eventType) {
      case 'purchase':
        updatedStats.purchaseEvents = stats.purchaseEvents + value
        break
      case 'add_to_cart':
        updatedStats.addToCartEvents = stats.addToCartEvents + value
        break
      case 'begin_checkout':
        updatedStats.beginCheckoutEvents = stats.beginCheckoutEvents + value
        break
    }
    
    await kv.set(key, updatedStats)
  }

  static async getStats(shop: string): Promise<EventStats> {
    const key = `shop:${shop}:stats`
    const kv = await getKvStore()
    const stats = await kv.get<EventStats>(key)
    return stats || {
      totalEvents: 0,
      purchaseEvents: 0,
      addToCartEvents: 0,
      beginCheckoutEvents: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  static async resetStats(shop: string): Promise<void> {
    const key = `shop:${shop}:stats`
    const kv = await getKvStore()
    await kv.set(key, {
      totalEvents: 0,
      purchaseEvents: 0,
      addToCartEvents: 0,
      beginCheckoutEvents: 0,
      lastUpdated: new Date().toISOString()
    })
  }
}

// 通用缓存存储
export class CacheStorage {
  static async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    const kv = await getKvStore()
    await kv.set(`cache:${key}`, value, { ex: ttl })
  }

  static async get<T>(key: string): Promise<T | null> {
    const kv = await getKvStore()
    return await kv.get<T>(`cache:${key}`)
  }

  static async delete(key: string): Promise<void> {
    const kv = await getKvStore()
    await kv.del(`cache:${key}`)
  }

  static async exists(key: string): Promise<boolean> {
    const kv = await getKvStore()
    const result = await kv.exists(`cache:${key}`)
    return result === 1
  }
}

// 访问日志存储
export class AccessLogStorage {
  static async logAccess(shop: string, endpoint: string, userAgent?: string): Promise<void> {
    const logEntry = {
      shop,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString(),
      ip: 'unknown' // 在实际应用中可以获取真实IP
    }
    
    const key = `access_log:${shop}`
    const kv = await getKvStore()
    await kv.lpush(key, logEntry)
    // 只保留最近100条访问记录
    await kv.ltrim(key, 0, 99)
  }

  static async getAccessLogs(shop: string, limit = 50): Promise<Record<string, unknown>[]> {
    const key = `access_log:${shop}`
    const kv = await getKvStore()
    const logs = await kv.lrange(key, 0, limit - 1)
    return (logs as unknown as Record<string, unknown>[]) || []
  }

  static async getAccessCount(shop: string, hours = 24): Promise<number> {
    const logs = await this.getAccessLogs(shop, 1000)
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return logs.filter(log => {
      const logTime = new Date((log as { timestamp: string }).timestamp)
      return logTime > cutoffTime
    }).length
  }
}

// 商店配置存储
export async function setShopConfig(shop: string, config: ShopConfig): Promise<void> {
  return Storage.setShopConfig(shop, config)
}

export async function getShopConfig(shop: string): Promise<ShopConfig | null> {
  return Storage.getShopConfig(shop)
}

// 会话存储  
export async function setSession(sessionId: string, sessionData: Record<string, unknown>): Promise<void> {
  return Storage.setSession(sessionId, sessionData)
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  return Storage.getSession(sessionId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  return Storage.deleteSession(sessionId)
}

// 事件存储
export async function addEvent(shop: string, event: ConversionEvent): Promise<void> {
  return Storage.addEvent(shop, event)
}

export async function getEvents(shop: string, limit: number = 100): Promise<ConversionEvent[]> {
  return Storage.getEvents(shop, limit)
}

// 统计更新
export async function updateStats(shop: string, eventType: string, value: number = 1): Promise<void> {
  return Storage.updateStats(shop, eventType, value)
}

export async function getStats(shop: string): Promise<EventStats> {
  return Storage.getStats(shop)
}

// 缓存操作
export async function setCache(key: string, data: unknown, ttl: number = 300): Promise<void> {
  return Storage.setCache(key, data, ttl)
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  return Storage.getCache<T>(key)
}

export async function deleteCache(key: string): Promise<void> {
  return Storage.deleteCache(key)
}

// 访问日志
export async function logAccess(shop: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
  return Storage.logAccess(shop, action, metadata)
}

export async function getAccessLogs(shop: string, limit: number = 50): Promise<Record<string, unknown>[]> {
  return Storage.getAccessLogs(shop, limit)
} 