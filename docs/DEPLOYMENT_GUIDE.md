# 🚀 项目部署完整指南

## 📋 部署概览

这个指南将帮助您将Shopify Google Ads Pixel应用完整部署到生产环境。

### 部署架构
```
GitHub仓库 → Vercel平台 → 生产环境
     ↓           ↓           ↓
   代码管理    自动构建    应用运行
```

## 🔧 第一步：创建Shopify Partner账号

### 1.1 注册Partner账号
1. 访问 [Shopify Partners](https://partners.shopify.com/)
2. 点击 **"成为Shopify合作伙伴"**
3. 填写注册信息（姓名、邮箱、公司等）
4. 验证邮箱并完成注册

### 1.2 创建应用
1. 登录Partner Dashboard
2. 点击 **"应用"** → **"创建应用"**
3. 选择 **"公共应用"**
4. 填写应用基本信息：
   ```
   应用名称: Google Ads Pixel Tracker
   应用URL: https://你的项目名.vercel.app (暂时填写，部署后再更新)
   允许的重定向URL: https://你的项目名.vercel.app/api/auth/callback
   ```

### 1.3 获取API凭证
创建成功后，记录以下信息（稍后配置需要）：
- **API Key**: 类似 `1234567890abcdef`
- **API Secret**: 类似 `1234567890abcdef1234567890abcdef`

## 🚀 第二步：部署到Vercel

### 2.1 登录Vercel
1. 访问 [Vercel](https://vercel.com/)
2. 使用GitHub账号登录
3. 授权Vercel访问您的GitHub仓库

### 2.2 导入项目
1. 在Vercel Dashboard中点击 **"New Project"**
2. 找到并选择您的 `ShopifyEvent` 仓库
3. 点击 **"Import"**

### 2.3 配置构建设置
Vercel会自动检测这是Next.js项目，使用默认设置：
```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 2.4 配置环境变量
在部署前，添加以下环境变量：

**必需变量（先用临时值）：**
```bash
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://你的项目名.vercel.app
NODE_ENV=production
```

**可选变量（暂时不配置）：**
```bash
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com
KV_REST_API_URL=（稍后配置）
KV_REST_API_TOKEN=（稍后配置）
```

### 2.5 开始部署
1. 点击 **"Deploy"** 开始部署
2. 等待构建完成（通常2-3分钟）
3. 获取部署URL，类似：`https://shopify-event-abc123.vercel.app`

## 🔗 第三步：更新Shopify应用配置

### 3.1 更新应用URL
1. 回到Shopify Partner Dashboard
2. 找到您的应用，点击进入设置
3. 更新以下URL：
   ```
   应用URL: https://你的实际vercel域名.vercel.app
   允许的重定向URL: https://你的实际vercel域名.vercel.app/api/auth/callback
   ```

### 3.2 配置应用权限
在应用设置中，确保添加了以下权限：
```
read_script_tags - 读取脚本标签
write_script_tags - 写入脚本标签  
read_orders - 读取订单数据
read_analytics - 读取分析数据
write_pixels - 写入像素数据
```

### 3.3 设置Webhook
1. 在应用设置中找到 **"Webhooks"**
2. 添加必需的webhook：
   ```
   URL: https://你的实际vercel域名.vercel.app/api/webhooks/app/uninstalled
   事件: app/uninstalled
   格式: JSON
   ```

### 3.4 更新Vercel环境变量
1. 回到Vercel项目设置
2. 更新环境变量为实际值：
   ```bash
   SHOPIFY_API_KEY=你的实际API_Key
   SHOPIFY_API_SECRET=你的实际API_Secret
   SHOPIFY_APP_URL=https://你的实际vercel域名.vercel.app
   ```

### 3.5 重新部署
1. 在Vercel项目中，点击 **"Deployments"**
2. 点击最新部署旁的 **"..."** → **"Redeploy"**
3. 等待重新部署完成

## 💾 第四步：配置Vercel KV数据库

### 4.1 创建KV数据库
1. 在Vercel项目中，点击 **"Storage"** 标签
2. 点击 **"Create Database"**
3. 选择 **"KV"**
4. 配置数据库：
   ```
   数据库名称: google-ads-pixel-db
   区域: 选择离您用户最近的区域
   ```
5. 点击 **"Create"**

### 4.2 获取连接信息
创建完成后，复制显示的连接信息：
```bash
KV_REST_API_URL=https://xxx-xxx-xxx.upstash.io
KV_REST_API_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxBxxxxxxxxxxxxxxxxxxx
```

### 4.3 添加KV环境变量
1. 在Vercel项目设置的 **"Environment Variables"** 中添加：
   ```bash
   KV_REST_API_URL=你的KV_URL
   KV_REST_API_TOKEN=你的KV_TOKEN
   ```
2. 确保选择 **Production**, **Preview**, **Development** 所有环境

### 4.4 最终重新部署
再次重新部署以应用KV配置：
1. **Deployments** → **"Redeploy"**
2. 等待部署完成

## 🧪 第五步：测试部署

### 5.1 创建开发商店（测试用）
1. 在Shopify Partner Dashboard中点击 **"商店"**
2. 点击 **"创建商店"**
3. 选择 **"开发商店"**
4. 填写测试商店信息

### 5.2 测试应用安装
1. 构建测试安装URL：
   ```
   https://你的开发商店.myshopify.com/admin/oauth/authorize?client_id=你的API_KEY&scope=read_script_tags,write_script_tags,read_orders,read_analytics,write_pixels&redirect_uri=https://你的vercel域名.vercel.app/api/auth/callback&state=test123
   ```
2. 在浏览器中访问这个URL
3. 确认安装授权
4. 验证是否成功重定向到应用主页

### 5.3 测试功能
1. 访问应用主页，确认界面正常显示
2. 尝试配置Google Ads信息
3. 访问 `/test` 页面进行功能测试
4. 检查浏览器开发者工具，确认无错误

## ✅ 部署验证清单

### 基础功能
- [ ] 应用首页可以正常访问
- [ ] OAuth认证流程工作正常
- [ ] 配置页面可以保存设置
- [ ] 测试页面功能正常
- [ ] 没有构建错误或警告

### Shopify集成
- [ ] 应用可以在开发商店中安装
- [ ] 权限授权流程正常
- [ ] Webhook端点响应正常
- [ ] Script Tag可以正确安装

### 数据存储
- [ ] KV数据库连接正常
- [ ] 配置数据可以保存和读取
- [ ] 会话信息正确存储

## 🚀 第六步：生产环境优化

### 6.1 自定义域名（可选）
1. 在Vercel项目设置中点击 **"Domains"**
2. 添加您的自定义域名
3. 配置DNS记录
4. 更新Shopify应用中的URL配置

### 6.2 监控设置
1. 启用Vercel Analytics（免费）
2. 设置错误监控和告警
3. 配置性能监控

### 6.3 安全优化
1. 确认所有环境变量已正确设置
2. 验证CORS和CSP配置
3. 检查敏感信息是否正确保护

## 📊 成本估算

### Vercel费用
- **Hobby计划**: $0/月
  - 100GB带宽
  - 无限静态文件
  - 100个Serverless函数执行/天

- **Pro计划**: $20/月 
  - 1TB带宽
  - 无限Serverless函数执行
  - 高级分析功能

### Vercel KV费用
- **免费套餐**: $0/月
  - 30,000次读取
  - 1,000次写入
  - 256MB存储

- **付费套餐**: $20/月起
  - 100万次读取
  - 10万次写入
  - 1GB存储

## 🆘 常见问题解决

### Q1: 部署失败怎么办？
1. 检查构建日志中的错误信息
2. 确认所有依赖都已正确安装
3. 验证环境变量配置
4. 检查代码中是否有语法错误

### Q2: OAuth认证失败？
1. 确认重定向URL配置正确
2. 检查API Key和Secret是否正确
3. 验证权限scope是否完整
4. 确认Shopify应用URL已更新

### Q3: KV数据库连接失败？
1. 确认KV环境变量配置正确
2. 检查KV数据库是否已创建
3. 验证token权限
4. 确认重新部署后配置生效

### Q4: Script Tag无法安装？
1. 检查write_script_tags权限
2. 确认OAuth流程完整
3. 验证webhook处理正常
4. 检查API调用是否成功

## 📞 获取帮助

- **Vercel文档**: https://vercel.com/docs
- **Shopify开发文档**: https://shopify.dev/
- **GitHub Issues**: 在您的仓库中创建issue
- **技术支持**: 根据遇到的具体问题寻求帮助

---

## 🎉 恭喜！

完成以上步骤后，您的Shopify Google Ads Pixel应用就成功部署到生产环境了！现在您可以：

1. 🎯 **开始测试** - 在开发商店中全面测试功能
2. 🏪 **准备上架** - 准备应用商店所需的材料
3. 💰 **商业运营** - 开始真正的商业化运营

**下一步建议**: 查看 `docs/SHOPIFY_MARKETPLACE.md` 了解如何将应用提交到Shopify应用商店！ 