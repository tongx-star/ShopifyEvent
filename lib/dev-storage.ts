/**
 * 开发环境存储适配器
 * 在本地开发时使用内存存储替代 Vercel KV
 */

// 内存存储
const memoryStore = new Map<string, unknown>();
const listStore = new Map<string, unknown[]>();
const expireStore = new Map<string, number>();

// 清理过期数据
setInterval(() => {
  const now = Date.now();
  const expireEntries = Array.from(expireStore.entries());
  for (const [key, expireTime] of expireEntries) {
    if (now > expireTime) {
      memoryStore.delete(key);
      listStore.delete(key);
      expireStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export const devKV = {
  async get<T>(key: string): Promise<T | null> {
    if (expireStore.has(key) && Date.now() > expireStore.get(key)!) {
      memoryStore.delete(key);
      expireStore.delete(key);
      return null;
    }
    return (memoryStore.get(key) as T) || null;
  },

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown> {
    memoryStore.set(key, value);
    if (options?.ex) {
      expireStore.set(key, Date.now() + options.ex * 1000);
    }
    return 'OK';
  },

  async del(key: string): Promise<unknown> {
    memoryStore.delete(key);
    listStore.delete(key);
    expireStore.delete(key);
    return 1;
  },

  async lpush(key: string, value: unknown): Promise<unknown> {
    const list = listStore.get(key) || [];
    list.unshift(value);
    listStore.set(key, list);
    return list.length;
  },

  async lrange(key: string, start: number, end: number): Promise<unknown[]> {
    const list = listStore.get(key) || [];
    if (end === -1) {
      return list.slice(start);
    }
    return list.slice(start, end + 1);
  },

  async ltrim(key: string, start: number, end: number): Promise<unknown> {
    const list = listStore.get(key) || [];
    const trimmed = list.slice(start, end + 1);
    listStore.set(key, trimmed);
    return 'OK';
  },

  async llen(key: string): Promise<number> {
    const list = listStore.get(key) || [];
    return list.length;
  },

  async exists(key: string): Promise<number> {
    if (expireStore.has(key) && Date.now() > expireStore.get(key)!) {
      memoryStore.delete(key);
      listStore.delete(key);
      expireStore.delete(key);
      return 0;
    }
    return memoryStore.has(key) || listStore.has(key) ? 1 : 0;
  }
}; 