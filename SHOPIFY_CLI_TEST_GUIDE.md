# 🚀 Shopify CLI 测试指南

## ✅ 配置完成状态

您的Shopify应用已成功配置：
- **应用名称**: CESHI
- **应用ID**: 7fe053e33eb0b7215a17ba32ad156fb2
- **Handle**: ceshi-25
- **Web Pixels扩展**: 已配置

## 🔧 当前运行状态

1. **Shopify CLI**: 正在后台运行
2. **Next.js应用**: 运行在 http://localhost:3002
3. **扩展配置**: 已修复handle字段

## 🎯 如何使用Shopify CLI测试

### 第1步：访问开发商店

Shopify CLI会为您提供一个开发商店链接，通常格式为：
```
https://your-dev-store.myshopify.com/admin/apps/ceshi-25
```

### 第2步：在开发商店中安装应用

1. 点击CLI提供的安装链接
2. 授权应用权限
3. 应用会安装到您的开发商店

### 第3步：配置Web Pixels扩展

1. 在开发商店管理后台，导航到：
   ```
   设置 → 客户事件 (Settings → Customer events)
   ```

2. 点击"添加像素"或"Connect pixel"

3. 在"应用"选项卡中找到"Google Ads Conversion Tracking"

4. 配置扩展设置：
   - Conversion ID: AW-123456789
   - Purchase Label: purchase_test
   - Add to Cart Label: cart_test
   - Begin Checkout Label: checkout_test
   - Enhanced Conversions: 启用

### 第4步：测试转化事件

1. **在开发商店前台进行购物测试**：
   - 添加商品到购物车
   - 开始结账流程
   - 完成购买

2. **查看转化事件**：
   - 打开浏览器开发者工具
   - 查看Network标签页
   - 验证Google Ads转化事件是否发送

## 📋 CLI命令参考

### 基本命令
```bash
# 启动开发服务器
shopify app dev

# 部署应用和扩展
shopify app deploy

# 查看应用信息
shopify app info

# 生成新扩展
shopify app generate extension
```

### 扩展相关命令
```bash
# 部署扩展
shopify app deploy --extension=google-ads-pixel

# 查看扩展状态
shopify app extensions list

# 预览扩展
shopify app extensions dev
```

## 🧪 测试流程

### 1. 验证应用安装
```bash
# 检查应用是否正确安装到开发商店
curl -H "X-Shopify-Access-Token: YOUR_TOKEN" \
     "https://your-dev-store.myshopify.com/admin/api/2025-04/apps.json"
```

### 2. 测试配置API
```bash
# 测试应用配置保存
curl -X POST "http://localhost:3002/api/config?shop=your-dev-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"googleAds":{"conversionId":"AW-123456789","purchaseLabel":"purchase","addToCartLabel":"cart","beginCheckoutLabel":"checkout","enhancedConversions":true}}'
```

### 3. 验证Web Pixels扩展
1. 访问开发商店前台
2. 打开浏览器开发者工具
3. 执行购物操作
4. 查看转化事件是否正确发送

## 🔍 故障排除

### 问题1：扩展未显示在客户事件中
**解决方案**：
```bash
# 重新部署扩展
shopify app deploy
```

### 问题2：转化事件未发送
**解决方案**：
1. 检查扩展配置是否正确
2. 验证Google Ads转化ID格式
3. 查看浏览器控制台错误

### 问题3：应用无法访问
**解决方案**：
```bash
# 重启开发服务器
shopify app dev --reset
```

## 📊 监控和调试

### 查看实时日志
```bash
# Shopify CLI日志
shopify app logs

# Next.js应用日志
npm run dev -- --verbose
```

### 调试API端点
```bash
# 查看应用状态
curl "http://localhost:3002/api/debug?shop=your-dev-store.myshopify.com"

# 查看事件记录
curl "http://localhost:3002/api/events?shop=your-dev-store.myshopify.com"
```

## 🎯 成功指标

测试成功的标志：
- ✅ 应用成功安装到开发商店
- ✅ Web Pixels扩展在客户事件中可见
- ✅ 转化事件正确发送到Google Ads
- ✅ 浏览器开发者工具显示网络请求
- ✅ 应用配置正确保存和读取

## 📝 下一步

测试完成后：
1. 准备生产环境配置
2. 提交应用商店审核
3. 配置真实的Google Ads转化ID
4. 部署到Vercel或其他云平台

---

**注意**: 开发商店中的测试数据不会影响真实的Google Ads账户，可以安全测试所有功能。 