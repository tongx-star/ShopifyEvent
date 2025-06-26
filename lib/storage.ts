import { devKV } from './dev-storage'
import { ShopConfig, ConversionEvent, EventStats } from './types'

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

let kvStore: KVStore | null = null

async function initKvStore(): Promise<KVStore> {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv')
      return kv as unknown as KVStore
    } else {
      return devKV
    }
  } catch (error) {
    console.error('初始化KV存储失败:', error)
    return devKV
  }
}

async function getKvStore(): Promise<KVStore> {
  if (!kvStore) {
    kvStore = await initKvStore()
  }
  return kvStore
}

export class Storage {
  // 商店配置
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

  // 会话管理
  static async setSession(sessionId: string, sessionData: Record<string, unknown>): Promise<void> {
    const key = `session:${sessionId}`
    const kv = await getKvStore()
    await kv.set(key, sessionData, { ex: 3600 })
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
}

// 便利函数
export async function setShopConfig(shop: string, config: ShopConfig): Promise<void> {
  return Storage.setShopConfig(shop, config)
}

export async function getShopConfig(shop: string): Promise<ShopConfig | null> {
  return Storage.getShopConfig(shop)
}

export async function setSession(sessionId: string, sessionData: Record<string, unknown>): Promise<void> {
  return Storage.setSession(sessionId, sessionData)
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  return Storage.getSession(sessionId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  return Storage.deleteSession(sessionId)
}

export async function addEvent(shop: string, event: ConversionEvent): Promise<void> {
  const key = `shop:${shop}:events`
  const kv = await getKvStore()
  await kv.lpush(key, event)
  await kv.ltrim(key, 0, 999) // 保留最近1000条事件
}

export async function getEvents(shop: string, limit: number = 100): Promise<ConversionEvent[]> {
  const key = `shop:${shop}:events`
  const kv = await getKvStore()
  const events = await kv.lrange(key, 0, limit - 1)
  return (events as unknown as ConversionEvent[]) || []
}

export async function updateStats(shop: string, eventType: string, value: number = 1): Promise<void> {
  try {
    const currentStats = await getStats(shop)
    const updatedStats = { ...currentStats }
    
    updatedStats.totalEvents = currentStats.totalEvents + value
    
    if (eventType === 'purchase') {
      updatedStats.purchases = currentStats.purchases + value
    } else if (eventType === 'add_to_cart') {
      updatedStats.addToCarts = currentStats.addToCarts + value
    } else if (eventType === 'begin_checkout') {
      updatedStats.beginCheckouts = currentStats.beginCheckouts + value
    }
    
    updatedStats.lastEventAt = new Date().toISOString()
    
    const statsKey = `shop:${shop}:stats`
    await Storage.setCache(statsKey, updatedStats)
  } catch (error) {
    console.error('更新统计信息失败:', error)
  }
}

export async function getStats(shop: string): Promise<EventStats> {
  try {
    const statsKey = `shop:${shop}:stats`
    const stats = await Storage.getCache(statsKey) as EventStats
    
    return stats || {
      totalEvents: 0,
      purchases: 0,
      addToCarts: 0,
      beginCheckouts: 0,
      lastEventAt: null
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return {
      totalEvents: 0,
      purchases: 0,
      addToCarts: 0,
      beginCheckouts: 0,
      lastEventAt: null
    }
  }
}

export async function setCache(key: string, data: unknown, ttl: number = 300): Promise<void> {
  return Storage.setCache(key, data, ttl)
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  return Storage.getCache<T>(key)
}

export async function deleteCache(key: string): Promise<void> {
  return Storage.deleteCache(key)
}

export async function logAccess(shop: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const logEntry = {
    shop,
    action,
    timestamp: new Date().toISOString(),
    metadata
  }
  
  const key = `shop:${shop}:access_log`
  const kv = await getKvStore()
  await kv.lpush(key, logEntry)
  await kv.ltrim(key, 0, 99) // 保留最近100条日志
}

export async function getAccessLogs(shop: string, limit: number = 50): Promise<Record<string, unknown>[]> {
  const key = `shop:${shop}:access_log`
  const kv = await getKvStore()
  const logs = await kv.lrange(key, 0, limit - 1)
  return (logs as unknown as Record<string, unknown>[]) || []
} 