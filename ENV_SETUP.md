# 环境变量配置指南

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