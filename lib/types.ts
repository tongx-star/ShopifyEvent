// Google Ads配置接口
export interface GoogleAdsConfig {
  conversionId: string;           // AW-123456789
  purchaseLabel: string;          // 购买转化标签
  addToCartLabel?: string;        // 加购转化标签（可选）
  beginCheckoutLabel?: string;    // 结账转化标签（可选）
  enhancedConversions?: boolean;  // 增强转化
}

// 商店配置接口
export interface ShopConfig {
  shop: string;
  googleAds: GoogleAdsConfig;
  updatedAt: string;
}

// API响应接口
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 转化事件记录接口
export interface ConversionEvent {
  id: string;
  shop: string;
  eventType: 'purchase' | 'add_to_cart' | 'begin_checkout';
  timestamp: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  status: 'success' | 'failed';
}

// 事件统计接口
export interface EventStats {
  totalEvents: number;
  purchases: number;
  addToCarts: number;
  beginCheckouts: number;
  lastEventAt: string | null;
} 