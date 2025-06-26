// Google Ads配置接口
export interface GoogleAdsConfig {
  conversionId: string;           // AW-123456789
  purchaseLabel: string;          // 购买转化标签
  addToCartLabel?: string;        // 加购转化标签
  beginCheckoutLabel?: string;    // 结账转化标签
  enhancedConversions?: boolean;  // 增强转化
}

// 商店配置接口
export interface ShopConfig {
  shop: string;
  googleAds: GoogleAdsConfig;
  enabledEvents: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Shopify会话接口
export interface ShopifySession {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope?: string;
  expires?: Date;
  accessToken: string;
  userId?: bigint;
}

// 事件数据接口
export interface EventData extends Record<string, unknown> {
  value?: number;
  currency?: string;
  transaction_id?: string;
  product_id?: string;
  product_name?: string;
  variant_id?: string;
  quantity?: number;
  items?: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    price: number;
  }>;
}

// 转化事件接口
export interface ConversionEvent {
  id: string;
  shop: string;
  eventType: 'purchase' | 'add_to_cart' | 'begin_checkout';
  timestamp: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  productId?: string;
  status: 'success' | 'failed' | 'pending';
  data?: Record<string, unknown>;
}

// 事件统计接口
export interface EventStats {
  totalEvents: number;
  purchaseEvents: number;
  addToCartEvents: number;
  beginCheckoutEvents: number;
  lastUpdated: string;
}

// API响应接口
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Shopify Analytics事件接口
export interface ShopifyAnalyticsEvent {
  data: {
    productVariant?: {
      id: string;
      product: {
        id: string;
        title: string;
      };
      title: string;
      price: {
        amount: string;
        currencyCode: string;
      };
    };
    checkout?: {
      totalPrice: {
        amount: string;
      };
      currencyCode: string;
      order?: {
        id: string;
      };
      lineItems: Array<{
        variant: {
          id: string;
          product: {
            id: string;
            title: string;
          };
          price: {
            amount: string;
          };
        };
        quantity: number;
      }>;
    };
    quantity?: number;
  };
}

// 测试事件接口
export interface TestEventRequest {
  eventType: 'purchase' | 'add_to_cart' | 'begin_checkout';
  testData?: EventData;
} 