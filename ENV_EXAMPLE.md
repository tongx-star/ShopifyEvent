# 环境变量配置说明

将此文件重命名为 `.env.local` 并填入你的实际配置值：

```bash
# Shopify应用配置
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_APP_URL=https://your-app-domain.vercel.app

# 生产环境存储 (Vercel KV)
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_rest_api_token

# 可选：开发环境设置
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com

# Next.js环境
NODE_ENV=development
```

## 配置步骤：

1. **Shopify Partner账号设置**：
   - 访问 [Shopify Partners](https://partners.shopify.com/)
   - 创建新的应用
   - 获取API Key和API Secret

2. **Vercel KV设置**（生产环境）：
   - 在Vercel项目中添加KV存储
   - 获取REST API URL和Token

3. **开发环境**：
   - 本地开发会自动使用内存存储
   - 无需配置KV相关变量 