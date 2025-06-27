import crypto from 'crypto'

// Shopify会话接口
interface ShopifySession {
  shop: string;
  accessToken: string;
  scope?: string;
}

// Shopify API配置
export const SHOPIFY_CONFIG = {
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecret: process.env.SHOPIFY_API_SECRET || '',
  scopes: 'write_pixels,read_orders,read_analytics',
  appUrl: process.env.SHOPIFY_APP_URL || 'https://localhost:3000'
}

// 验证Shopify会话
export function validateShopifySession(session: ShopifySession): boolean {
  return !!(
    session &&
    session.shop &&
    session.accessToken
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

// 验证Webhook签名
export function verifyWebhook(rawBody: string, signature: string): boolean {
  if (!signature || !SHOPIFY_CONFIG.apiSecret) {
    return false
  }

  try {
    const hmac = crypto
      .createHmac('sha256', SHOPIFY_CONFIG.apiSecret)
      .update(rawBody, 'utf8')
      .digest('base64')

    return hmac === signature
  } catch (error) {
    console.error('Webhook验证失败:', error)
    return false
  }
} 