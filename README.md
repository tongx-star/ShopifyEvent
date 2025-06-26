# Google Ads Pixel - Shopify应用

一个专业的Shopify应用，用于自动追踪Google Ads转化事件，包括购买、加购物车和开始结账事件。

## 🚀 功能特性

- ✅ **自动转化追踪** - 追踪购买、加购、开始结账三个关键事件
- ✅ **简单配置** - 在Shopify Admin中直接配置Google Ads转化ID和标签
- ✅ **主题集成** - 通过主题应用扩展无缝集成，无需手动编辑代码
- ✅ **智能存储** - 开发环境使用内存存储，生产环境使用Vercel KV
- ✅ **实时监控** - 提供事件统计和错误监控
- ✅ **符合标准** - 完全符合Shopify应用商店要求

## 📋 系统要求

- Node.js 18.0.0+
- Shopify Partner账号
- Google Ads账号
- Vercel账号（用于部署）

## 🛠 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/shopify-google-ads-pixel.git
cd shopify-google-ads-pixel
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# Shopify应用配置
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_APP_URL=https://your-app-domain.vercel.app

# 生产环境存储 (Vercel KV)
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_rest_api_token

# 开发环境设置
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com
NODE_ENV=development
```

### 4. 本地开发

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 🔧 Shopify Partner配置

### 1. 创建Shopify应用

1. 访问 [Shopify Partners](https://partners.shopify.com/)
2. 点击"创建应用" → "公共应用"
3. 填写应用信息：
   - **应用名称**: Google Ads Pixel App
   - **应用URL**: `https://your-domain.vercel.app`
   - **重定向URL**: `https://your-domain.vercel.app/api/auth/callback`

### 2. 配置应用权限

在应用设置中添加以下权限：
- `read_script_tags` - 读取脚本标签
- `write_script_tags` - 写入脚本标签  
- `read_orders` - 读取订单数据
- `read_analytics` - 读取分析数据
- `write_pixels` - 写入像素数据

### 3. 设置Webhook

添加强制性Webhook：
- **URL**: `https://your-domain.vercel.app/api/webhooks/app/uninstalled`
- **事件**: `app/uninstalled`

## 🚀 部署到Vercel

### 1. 连接GitHub

```bash
# 推送代码到GitHub
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. 在Vercel中部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击"Import Project"
3. 选择你的GitHub仓库
4. 配置环境变量（复制.env.local的内容）
5. 点击"Deploy"

### 3. 配置Vercel KV

1. 在Vercel项目中，点击"Storage"
2. 创建新的KV数据库
3. 复制连接信息到环境变量

## 📱 安装到Shopify商店

### 1. 开发环境安装

```bash
# 使用Shopify CLI (如果已安装)
shopify app serve

# 或直接访问OAuth URL
https://your-dev-store.myshopify.com/admin/oauth/authorize?client_id=YOUR_API_KEY&scope=read_script_tags,write_script_tags,read_orders,read_analytics,write_pixels&redirect_uri=https://your-domain.vercel.app/api/auth/callback&state=random_state
```

### 2. 生产环境

1. 在Shopify Partner Dashboard中提交应用审核
2. 审核通过后，商家可以从应用商店安装

## ⚙️ 配置Google Ads

### 1. 在应用中配置

安装应用后，在Shopify Admin中：

1. 打开应用
2. 配置Google Ads设置：
   - **转化ID**: `AW-XXXXXXXXX`
   - **购买标签**: `purchase_label`
   - **加购标签**: `add_to_cart_label`
   - **开始结账标签**: `begin_checkout_label`
3. 选择要追踪的事件
4. 保存配置

### 2. 在主题编辑器中启用

1. 进入 **在线商店** → **主题** → **自定义**
2. 在左侧面板中找到 **应用嵌入**
3. 启用 **Google Ads Pixel**

## 🧪 测试功能

### 1. 使用内置测试页面

访问 `https://your-domain.vercel.app/test` 进行功能测试。

### 2. 使用自动化测试脚本

```bash
chmod +x scripts/test-conversion.sh
./scripts/test-conversion.sh
```

### 3. 验证转化追踪

1. 在浏览器开发者工具中检查网络请求
2. 查找发送到 `googleads.g.doubleclick.net` 的请求
3. 验证事件参数是否正确

## 📊 监控和分析

### 1. 应用内统计

- 访问应用主页查看事件统计
- 监控转化发送成功率
- 查看错误日志

### 2. Google Ads后台

- 登录Google Ads账号
- 查看 **工具和设置** → **转化**
- 验证转化数据是否正确接收

## 🛡️ 安全和合规

- ✅ 使用OAuth 2.0认证
- ✅ Webhook验证HMAC签名
- ✅ 安全存储访问令牌
- ✅ 符合GDPR和数据保护要求
- ✅ 通过Shopify应用审核标准

## 📁 项目结构

```
├── app/                    # Next.js应用目录
│   ├── api/               # API路由
│   │   ├── auth/         # OAuth认证
│   │   ├── config/       # 配置管理
│   │   ├── events/       # 事件追踪
│   │   ├── pixel/        # Pixel代码生成
│   │   └── webhooks/     # Webhook处理
│   ├── components/       # React组件
│   └── test/            # 测试页面
├── extensions/           # Shopify应用扩展
│   └── google-ads-pixel/ # 主题应用扩展
├── lib/                 # 工具库
├── scripts/             # 测试脚本
├── docs/               # 文档
└── shopify.app.toml    # Shopify应用配置
```

## 🐛 故障排除

### 常见问题

1. **无法安装应用**
   - 检查OAuth URL是否正确
   - 验证API Key和Secret
   - 确保重定向URL匹配

2. **转化未被追踪**
   - 验证Google Ads配置
   - 检查Script Tag是否正确安装
   - 确认事件是否成功发送

3. **在主题编辑器中找不到应用**
   - 确保主题应用扩展已正确配置
   - 检查应用权限设置
   - 验证扩展文件结构

### 获取帮助

- 📧 邮箱支持: support@your-domain.com
- 📖 查看文档: [docs/google-ads-testing.md](docs/google-ads-testing.md)
- 🐛 报告问题: [GitHub Issues](https://github.com/your-username/repo/issues)

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交Pull Request和Issue来改进这个项目！

---

**注意**: 这是一个功能完整的Shopify应用，完全符合Shopify应用商店的要求和标准。 