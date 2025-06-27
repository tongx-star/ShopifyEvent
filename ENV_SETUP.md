# 🔧 环境配置指南

## 📋 问题解决

### 问题1：Shopify CLI配置错误
```
No app with client ID `{{SHOPIFY_API_KEY}}` found
```

**解决方案**：创建 `.env.local` 文件并配置正确的环境变量

### 问题2：配置API数据格式错误
```
TypeError: Cannot read properties of undefined (reading 'conversionId')
```

**解决方案**：已修复API验证逻辑，增加了空值检查

## 🚀 环境变量配置

### 1. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件：

```bash
# 在项目根目录运行
touch .env.local
```

### 2. 配置环境变量

将以下内容添加到 `.env.local` 文件中：

```env
# Shopify App 配置
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=http://localhost:3002
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com

# 数据库配置 (开发环境使用内存存储)
NODE_ENV=development

# Vercel KV (生产环境)
# KV_REST_API_URL=your_kv_url
# KV_REST_API_TOKEN=your_kv_token

# OAuth配置
SHOPIFY_SCOPES=read_script_tags,write_script_tags,read_orders,read_analytics,write_pixels
```

### 3. 获取Shopify API密钥

#### 方法1：通过Shopify合作伙伴后台
1. 访问 [Shopify合作伙伴后台](https://partners.shopify.com/)
2. 登录您的账户
3. 点击 "应用" → "创建应用"
4. 选择 "公共应用"
5. 填写应用信息
6. 获取 API密钥 和 API密钥(secret)

#### 方法2：使用Shopify CLI自动配置
```bash
# 重置并重新配置
shopify app dev --reset

# 这会引导您：
# 1. 登录Shopify合作伙伴账户
# 2. 创建新应用或选择现有应用
# 3. 自动生成配置文件
```

## 🔧 快速修复步骤

### 步骤1：修复API错误（已完成）
API验证逻辑已修复，现在会正确处理空值。

### 步骤2：配置Shopify CLI

```bash
# 方法1：使用reset重新配置
shopify app dev --reset

# 方法2：手动配置环境变量
# 1. 创建 .env.local 文件
# 2. 添加上述环境变量
# 3. 替换为您的实际值
```

### 步骤3：验证修复

```bash
# 1. 重启开发服务器
npm run dev

# 2. 测试配置API（在新终端）
curl -X POST "http://localhost:3002/api/config?shop=test-shop.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"googleAds":{"conversionId":"AW-123456789","purchaseLabel":"purchase_test","addToCartLabel":"cart_test","beginCheckoutLabel":"checkout_test","enhancedConversions":true}}'

# 3. 应该返回成功响应
```

## 📝 当前应用状态

### ✅ 已修复：
- [x] API验证逻辑错误
- [x] 空值检查问题
- [x] 错误处理改进

### ⏳ 需要配置：
- [ ] Shopify API密钥
- [ ] 开发商店URL
- [ ] 环境变量设置

### 🎯 推荐的测试流程

由于Shopify CLI配置较复杂，建议使用以下简化流程：

1. **跳过Shopify CLI**：暂时不使用 `shopify app dev`
2. **使用独立测试**：使用 `pixel-test.html` 页面测试功能
3. **API端点测试**：使用curl命令验证后端功能
4. **准备上架**：功能验证后直接准备应用商店提交

## 🚀 立即可用的解决方案

### 选项1：继续使用当前设置
您的应用API已经正常工作，可以：
- 使用浏览器访问 `http://localhost:3002`
- 配置Google Ads转化ID和标签
- 使用 `pixel-test.html` 测试转化事件

### 选项2：完整配置Shopify CLI
如果需要在真实Shopify环境测试：
- 获取Shopify API密钥
- 配置环境变量
- 使用 `shopify app dev --reset`

## 💡 建议

对于您的情况，我建议先使用**选项1**验证应用功能，然后再考虑是否需要完整的Shopify CLI配置。这样可以更快地验证您的Google Ads转化追踪功能是否正常工作。

## 📋 必需的环境变量

创建 `.env.local` 文件并配置以下环境变量：

### Shopify应用配置
```bash
# 从Shopify Partner Dashboard获取
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here

# 应用部署后的公网地址
SHOPIFY_APP_URL=https://your-app-domain.vercel.app
```

### 存储配置
```bash
# 生产环境：Vercel KV数据库配置
KV_REST_API_URL=https://your-kv-store.kv.vercel-storage.com
KV_REST_API_TOKEN=your_vercel_kv_token

# 开发环境会自动使用内存存储，不需要配置KV
```

### 开发环境配置
```bash
# 开发时使用的测试商店
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com

# 环境标识
NODE_ENV=development
```

## 🔧 可选配置

```bash
# 应用版本号
APP_VERSION=1.0.0

# 调试模式（显示详细日志）
DEBUG=false

# 日志级别 (error, warn, info, debug)
LOG_LEVEL=info
```

## 📝 配置步骤

### 1. 在Shopify Partner中创建应用
1. 登录 [Shopify Partners](https://partners.shopify.com/)
2. 创建新应用 → 公共应用
3. 记录API Key和API Secret

### 2. 配置应用URL和回调
- **应用URL**: `https://your-domain.vercel.app`
- **重定向URL**: `https://your-domain.vercel.app/api/auth/callback`

### 3. 设置应用权限
添加以下OAuth权限作用域：
- `read_script_tags` - 读取脚本标签
- `write_script_tags` - 写入脚本标签
- `read_orders` - 读取订单数据
- `read_analytics` - 读取分析数据
- `write_pixels` - 写入像素数据

### 4. 配置Vercel KV存储（生产环境）
1. 在Vercel项目中创建KV数据库
2. 复制REST API URL和Token到环境变量

### 5. 设置Webhook（必需）
- **URL**: `https://your-domain.vercel.app/api/webhooks/app/uninstalled`
- **事件**: `app/uninstalled`

## ⚠️ 安全注意事项

1. **永远不要**将 `.env.local` 文件提交到Git仓库
2. **永远不要**在客户端代码中暴露API Secret
3. 定期轮换API密钥和访问令牌
4. 在生产环境中使用HTTPS

## 🧪 验证配置

运行以下命令验证配置是否正确：

```bash
# 检查必需的环境变量
npm run type-check

# 本地开发服务器
npm run dev

# 测试安装流程
npm run test:install:local
```

## 🔍 故障排除

### 常见错误

1. **"缺少SHOPIFY_API_KEY"**
   - 检查.env.local文件是否存在
   - 确认变量名拼写正确

2. **"OAuth认证失败"**
   - 验证应用URL和回调URL配置
   - 检查API Key和Secret是否正确

3. **"无法连接到KV存储"**
   - 确认KV配置是否正确
   - 开发环境会自动使用内存存储

4. **"商店域名格式错误"**
   - 确保使用完整的.myshopify.com域名
   - 例如：`test-store.myshopify.com` 