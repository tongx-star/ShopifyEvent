# 🔧 开发环境测试指南

## 📋 问题分析

您的应用还没有上架到Shopify应用商店，所以无法通过Shopify管理后台的"客户事件"页面找到和启用Web Pixels扩展。

## 🎯 开发阶段测试方案

### 方案1：安装Shopify CLI进行本地测试

#### 步骤1：安装Shopify CLI
```bash
# 使用npm安装
npm install -g @shopify/cli @shopify/theme

# 或使用Homebrew安装（推荐macOS用户）
brew tap shopify/shopify
brew install shopify-cli
```

#### 步骤2：连接开发商店
```bash
# 在项目根目录运行
shopify app dev

# 如果是第一次运行，会要求：
# 1. 登录Shopify合作伙伴账户
# 2. 选择或创建应用
# 3. 选择开发商店
```

#### 步骤3：部署扩展到开发商店
```bash
# 部署Web Pixels扩展
shopify app deploy

# 或者仅部署扩展
shopify app generate extension --type=web_pixel_extension
```

### 方案2：创建独立测试页面（推荐）

由于设置Shopify CLI较复杂，我为您创建一个独立的测试页面：

#### 创建测试页面
```bash
# 在项目根目录创建测试文件
touch pixel-test.html
```

#### 测试步骤
1. 用浏览器打开 `pixel-test.html`
2. 修改配置信息（转化ID和标签）
3. 点击测试按钮验证事件发送
4. 检查浏览器开发者工具的网络标签页

### 方案3：直接测试API端点

您的应用API已经正常工作，可以直接测试：

#### 测试配置API
```bash
# 测试获取配置
curl "http://localhost:3002/api/config?shop=test-shop.myshopify.com"

# 测试保存配置
curl -X POST "http://localhost:3002/api/config?shop=test-shop.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "conversionId": "AW-123456789",
    "purchaseLabel": "purchase_test",
    "addToCartLabel": "cart_test",
    "beginCheckoutLabel": "checkout_test",
    "enhancedConversions": true
  }'
```

#### 测试调试API
```bash
# 查看应用状态
curl "http://localhost:3002/api/debug?shop=test-shop.myshopify.com"
```

## 🚀 上架前的完整测试流程

### 1. 本地功能测试
- ✅ API端点测试（已通过）
- ✅ 配置保存和读取（已通过）
- ⏳ Web Pixels扩展测试（需要测试页面）
- ⏳ 转化事件发送测试

### 2. 开发商店集成测试
- 安装应用到开发商店
- 配置Google Ads转化ID
- 测试真实购物流程
- 验证转化数据传输

### 3. 生产环境准备
- 配置生产环境变量
- 设置Vercel KV存储
- 配置OAuth回调URL
- 提交应用审核

## 📝 立即可用的测试方法

### 方法1：使用现有的调试页面
访问：`http://localhost:3002/api/debug?shop=test-shop.myshopify.com`

### 方法2：模拟Shopify事件
在浏览器控制台中运行：
```javascript
// 模拟购买完成事件
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shop: 'test-shop.myshopify.com',
    eventType: 'checkout_completed',
    eventData: {
      checkout: {
        totalPrice: { amount: 99.99, currencyCode: 'USD' },
        token: 'test_token_' + Date.now()
      }
    }
  })
});
```

## ⚡ 快速验证命令

运行以下命令验证应用核心功能：

```bash
# 1. 验证应用启动
npm run dev

# 2. 测试配置API（在新终端窗口）
curl "http://localhost:3002/api/config?shop=test.myshopify.com"

# 3. 测试调试API
curl "http://localhost:3002/api/debug?shop=test.myshopify.com"

# 4. 测试事件API
curl -X POST "http://localhost:3002/api/events" \
  -H "Content-Type: application/json" \
  -d '{"shop":"test.myshopify.com","eventType":"test","eventData":{}}'
```

## 🎯 下一步行动计划

1. **立即测试**：使用方法2和3验证核心功能
2. **创建测试页面**：如需要，我可以创建完整的HTML测试页面
3. **准备上架**：功能验证后，准备Shopify应用商店提交材料
4. **生产部署**：配置生产环境并部署到Vercel

您希望我创建独立的HTML测试页面，还是先用现有的API端点进行测试？ 