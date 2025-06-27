import { register } from '@shopify/web-pixels-extension';

register(({ analytics, settings }) => {
  // 获取配置
  const conversionId = settings.conversion_id;
  const purchaseLabel = settings.purchase_label;
  const addToCartLabel = settings.add_to_cart_label;
  const beginCheckoutLabel = settings.begin_checkout_label;
  const enhancedConversions = settings.enhanced_conversions;

  // 验证必要配置
  if (!conversionId || !purchaseLabel) {
    console.warn('[Google Ads Pixel] Missing required configuration');
    return;
  }

  // 加载Google Ads gtag
  function loadGoogleAds() {
    if (window.gtag) {
      initializeTracking();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
    script.onload = initializeTracking;
    script.onerror = () => console.error('[Google Ads Pixel] Failed to load gtag');
    
    document.head.appendChild(script);
  }

  // 初始化Google Ads追踪
  function initializeTracking() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    gtag('js', new Date());
    gtag('config', conversionId);
    
    console.log(`[Google Ads Pixel] Initialized with ID: ${conversionId}`);
  }

  // 安全的数值解析
  function safeParseFloat(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }

  // 购买完成事件
  analytics.subscribe('checkout_completed', (event) => {
    if (!purchaseLabel) return;

    try {
      const checkout = event.data.checkout;
      const conversionData = {
        send_to: `${conversionId}/${purchaseLabel}`,
        value: safeParseFloat(checkout.totalPrice.amount),
        currency: checkout.currencyCode,
        transaction_id: checkout.order?.id || checkout.token
      };

      // 增强转化数据
      if (enhancedConversions) {
        if (checkout.email) conversionData.email = checkout.email;
        if (checkout.phone) conversionData.phone_number = checkout.phone;
        if (checkout.billingAddress) {
          const addr = checkout.billingAddress;
          if (addr.firstName) conversionData.first_name = addr.firstName;
          if (addr.lastName) conversionData.last_name = addr.lastName;
          if (addr.address1) conversionData.address = {
            street: addr.address1,
            city: addr.city,
            region: addr.province,
            postal_code: addr.zip,
            country: addr.country
          };
        }
      }

      window.gtag('event', 'conversion', conversionData);
      console.log('[Google Ads Pixel] Purchase conversion sent:', conversionData);

    } catch (error) {
      console.error('[Google Ads Pixel] Purchase event error:', error);
    }
  });

  // 加购物车事件
  if (addToCartLabel) {
    analytics.subscribe('product_added_to_cart', (event) => {
      try {
        const cartLine = event.data.cartLine;
        const merchandise = cartLine.merchandise;
        
        const conversionData = {
          send_to: `${conversionId}/${addToCartLabel}`,
          value: safeParseFloat(cartLine.cost.totalAmount.amount),
          currency: cartLine.cost.totalAmount.currencyCode,
          items: [{
            item_id: merchandise.id,
            item_name: merchandise.product.title,
            item_variant: merchandise.title,
            quantity: cartLine.quantity,
            price: safeParseFloat(merchandise.price.amount)
          }]
        };

        window.gtag('event', 'conversion', conversionData);
        console.log('[Google Ads Pixel] Add to cart conversion sent:', conversionData);

      } catch (error) {
        console.error('[Google Ads Pixel] Add to cart event error:', error);
      }
    });
  }

  // 开始结账事件
  if (beginCheckoutLabel) {
    analytics.subscribe('checkout_started', (event) => {
      try {
        const checkout = event.data.checkout;
        
        const conversionData = {
          send_to: `${conversionId}/${beginCheckoutLabel}`,
          value: safeParseFloat(checkout.totalPrice.amount),
          currency: checkout.currencyCode,
          items: checkout.lineItems.map(item => ({
            item_id: item.variant.id,
            item_name: item.variant.product.title,
            item_variant: item.variant.title,
            quantity: item.quantity,
            price: safeParseFloat(item.variant.price.amount)
          }))
        };

        window.gtag('event', 'conversion', conversionData);
        console.log('[Google Ads Pixel] Begin checkout conversion sent:', conversionData);

      } catch (error) {
        console.error('[Google Ads Pixel] Begin checkout event error:', error);
      }
    });
  }

  // 初始化
  loadGoogleAds();
}); 