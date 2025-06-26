import { ShopifySession } from './types'
import crypto from 'crypto'

// Shopify API配置
export const SHOPIFY_CONFIG = {
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecret: process.env.SHOPIFY_API_SECRET || '',
  scopes: 'read_script_tags,write_script_tags,read_orders,read_analytics',
  appUrl: process.env.SHOPIFY_APP_URL || 'https://localhost:3000'
}

// 验证Shopify会话
export function validateShopifySession(session: ShopifySession): boolean {
  return !!(
    session &&
    session.shop &&
    session.accessToken &&
    session.scope?.includes('read_script_tags')
  )
}

// 创建Shopify OAuth URL
export function createShopifyOAuthUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: SHOPIFY_CONFIG.apiKey,
    scope: SHOPIFY_CONFIG.scopes,
    redirect_uri: `${SHOPIFY_CONFIG.appUrl}/api/auth/callback`,
    state,
    'grant_options[]': 'per-user'
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

// 验证Shopify域名格式
export function validateShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)
}

// 从URL中提取商店名称
export function extractShopName(shopDomain: string): string {
  return shopDomain.replace('.myshopify.com', '')
}

// 安装Script Tag到Shopify商店
export async function installScriptTag(
  shop: string, 
  accessToken: string, 
  scriptSrc: string
): Promise<boolean> {
  try {
    // 首先检查是否已存在Script Tag
    const existingTags = await getScriptTags(shop, accessToken)
    const existingTag = existingTags.find(
      (tag: { src: string }) => tag.src.includes('/api/pixel')
    )

    if (existingTag) {
      // 更新现有的Script Tag
      await updateScriptTag(shop, accessToken, existingTag.id, scriptSrc)
    } else {
      // 创建新的Script Tag
      await createScriptTag(shop, accessToken, scriptSrc)
    }

    return true
  } catch (error) {
    console.error('安装Script Tag失败:', error)
    return false
  }
}

// 获取所有Script Tags
async function getScriptTags(shop: string, accessToken: string): Promise<{ id: string; src: string }[]> {
  const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`获取Script Tags失败: ${response.status}`)
  }

  const data = await response.json()
  return data.script_tags || []
}

// 创建Script Tag
async function createScriptTag(shop: string, accessToken: string, src: string): Promise<void> {
  const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      script_tag: {
        event: 'onload',
        src: src,
        display_scope: 'all'
      }
    })
  })

  if (!response.ok) {
    throw new Error(`创建Script Tag失败: ${response.status}`)
  }
}

// 更新Script Tag
async function updateScriptTag(
  shop: string, 
  accessToken: string, 
  scriptTagId: string, 
  src: string
): Promise<void> {
  const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags/${scriptTagId}.json`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      script_tag: {
        id: scriptTagId,
        src: src
      }
    })
  })

  if (!response.ok) {
    throw new Error(`更新Script Tag失败: ${response.status}`)
  }
}

// 删除Script Tag
export async function removeScriptTag(
  shop: string, 
  accessToken: string, 
  scriptTagId: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags/${scriptTagId}.json`, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    })

    return response.ok
  } catch (error) {
    console.error('删除Script Tag失败:', error)
    return false
  }
}

// 验证Webhook
export function verifyWebhook(rawBody: string, signature: string): boolean {
  if (!SHOPIFY_CONFIG.apiSecret || !signature) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', SHOPIFY_CONFIG.apiSecret)
    .update(rawBody, 'utf8')
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
} 