import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@/lib/storage'
import { ShopConfig } from '@/lib/types'

// 生成Google Ads追踪像素代码
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    if (!shop) {
      return new NextResponse('缺少商店参数', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // 获取商店配置
    const config = await Storage.getShopConfig(shop)
    if (!config || !config.googleAds?.conversionId) {
      return new NextResponse(`
        console.warn('Google Ads配置未找到，请在应用中完成配置');
      `, {
        headers: { 'Content-Type': 'application/javascript' }
      })
    }

    // 生成追踪代码
    const pixelCode = generatePixelCode(config)
    
    // 记录代码生成
    console.log(`为商店 ${shop} 生成Pixel代码，转化ID: ${config.googleAds.conversionId}`)
    
    return new NextResponse(pixelCode, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('生成Pixel代码失败:', error)
    return new NextResponse(`
      console.error('Google Ads Pixel加载失败: ${error instanceof Error ? error.message : '未知错误'}');
    `, {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    })
  }
}

// 生成Google Ads Pixel代码
function generatePixelCode(config: ShopConfig): string {
  const { googleAds } = config
  const timestamp = new Date().toISOString()
  
  return `/*!
 * Google Ads 转化追踪代码
 * 生成时间: ${timestamp}
 * 转化ID: ${googleAds.conversionId}
 * 商店: ${config.shop}
 */
(function() {
  'use strict';
  
  // 防止重复加载
  if (window.__googleAdsPixelLoaded) {
    console.log('Google Ads Pixel already loaded');
    return;
  }
  window.__googleAdsPixelLoaded = true;
  
  var config = ${JSON.stringify(googleAds, null, 2)};
  var enabledEvents = ${JSON.stringify(config.enabledEvents || ['purchase'])};
  
  // 工具函数
  function debugLog(message, data) {
    if (console && console.log) {
      console.log('[Google Ads Pixel] ' + message, data || '');
    }
  }
  
  function safeParseFloat(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }
  
  // 加载Google Ads gtag
  function loadGtag() {
    if (window.gtag) {
      debugLog('gtag already loaded');
      initializeTracking();
      return;
    }
    
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.conversionId;
    script.onload = function() {
      debugLog('gtag script loaded');
      initializeTracking();
    };
    script.onerror = function() {
      debugLog('Failed to load gtag script');
    };
    
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  }
  
  // 初始化追踪
  function initializeTracking() {
    window.dataLayer = window.dataLayer || [];
    
    function gtag() {
      dataLayer.push(arguments);
    }
    
    window.gtag = window.gtag || gtag;
    
    gtag('js', new Date());
    gtag('config', config.conversionId);
    
    debugLog('Google Ads config initialized', config.conversionId);
    
    // 设置Shopify事件监听
    setupShopifyEventListeners(gtag);
  }
  
  // 设置Shopify事件监听
  function setupShopifyEventListeners(gtag) {
    if (!window.Shopify || !window.Shopify.analytics) {
      debugLog('Shopify analytics not available, retrying...');
      setTimeout(function() {
        setupShopifyEventListeners(gtag);
      }, 1000);
      return;
    }
    
    debugLog('Setting up Shopify event listeners');
    
    // 购买完成事件
    if (enabledEvents.indexOf('purchase') !== -1 && config.purchaseLabel) {
      window.Shopify.analytics.subscribe('checkout_completed', function(event) {
        try {
          var checkout = event.data.checkout;
          var conversionData = {
            'send_to': config.conversionId + '/' + config.purchaseLabel,
            'value': safeParseFloat(checkout.totalPrice.amount),
            'currency': checkout.currencyCode,
            'transaction_id': checkout.order ? checkout.order.id : checkout.token
          };
          
          ${googleAds.enhancedConversions ? `
          // 增强转化数据
          if (checkout.email) {
            conversionData.email = checkout.email;
          }
          if (checkout.phone) {
            conversionData.phone_number = checkout.phone;
          }
          ` : ''}
          
          gtag('event', 'conversion', conversionData);
          debugLog('Purchase conversion sent', conversionData);
          
          // 记录事件到服务器
          recordEvent('purchase', conversionData);
        } catch (error) {
          debugLog('Error processing purchase event', error);
        }
      });
    }
    
    ${googleAds.addToCartLabel ? `
    // 加购事件
    if (enabledEvents.indexOf('add_to_cart') !== -1) {
      window.Shopify.analytics.subscribe('product_added_to_cart', function(event) {
        try {
          var variant = event.data.productVariant;
          var conversionData = {
            'send_to': config.conversionId + '/' + config.addToCartLabel,
            'value': safeParseFloat(variant.price.amount),
            'currency': variant.price.currencyCode,
            'items': [{
              'item_id': variant.id,
              'item_name': variant.title,
              'category': variant.product.type,
              'quantity': 1,
              'price': safeParseFloat(variant.price.amount)
            }]
          };
          
          gtag('event', 'conversion', conversionData);
          debugLog('Add to cart conversion sent', conversionData);
          
          // 记录事件到服务器
          recordEvent('add_to_cart', conversionData);
        } catch (error) {
          debugLog('Error processing add to cart event', error);
        }
      });
    }
    ` : ''}
    
    ${googleAds.beginCheckoutLabel ? `
    // 开始结账事件
    if (enabledEvents.indexOf('begin_checkout') !== -1) {
      window.Shopify.analytics.subscribe('checkout_started', function(event) {
        try {
          var checkout = event.data.checkout;
          var conversionData = {
            'send_to': config.conversionId + '/' + config.beginCheckoutLabel,
            'value': safeParseFloat(checkout.totalPrice.amount),
            'currency': checkout.currencyCode,
            'items': checkout.lineItems.map(function(item) {
              return {
                'item_id': item.variant.id,
                'item_name': item.title,
                'category': item.variant.product.type,
                'quantity': item.quantity,
                'price': safeParseFloat(item.variant.price.amount)
              };
            })
          };
          
          gtag('event', 'conversion', conversionData);
          debugLog('Begin checkout conversion sent', conversionData);
          
          // 记录事件到服务器
          recordEvent('begin_checkout', conversionData);
        } catch (error) {
          debugLog('Error processing begin checkout event', error);
        }
      });
    }
    ` : ''}
  }
  
  // 记录事件到服务器
  function recordEvent(eventType, data) {
    if (typeof fetch === 'undefined') return;
    
    fetch('/api/events?shop=${config.shop}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: eventType,
        data: data,
        timestamp: new Date().toISOString()
      })
    }).catch(function(error) {
      debugLog('Failed to record event', error);
    });
  }
  
  // 启动加载流程
  debugLog('Starting Google Ads Pixel initialization');
  
  // 检查页面是否已加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGtag);
  } else {
    loadGtag();
  }
  
  debugLog('Google Ads Pixel setup complete');
})();`
} 