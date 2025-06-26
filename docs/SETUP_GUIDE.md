# 完整配置指南

## 🚀 第一步：Shopify Partner账号配置

### 1.1 创建Partner账号
1. 访问 [Shopify Partners](https://partners.shopify.com/)
2. 点击 **"成为Shopify合作伙伴"**
3. 填写个人/公司信息
4. 验证邮箱并完成注册

### 1.2 创建应用
1. 登录Partner Dashboard
2. 点击 **"应用"** → **"创建应用"**
3. 选择 **"公共应用"**
4. 填写应用信息：
   ```
   应用名称: Google Ads Pixel Tracker
   应用URL: https://你的域名.vercel.app
   允许的重定向URL: 
   - https://你的域名.vercel.app/api/auth/callback
   ```

### 1.3 获取API凭证
创建后，在应用设置页面获取：
- **API Key**: 复制保存
- **API Secret**: 复制保存

### 1.4 配置权限
在应用设置中添加权限：
```
read_script_tags
write_script_tags  
read_orders
read_analytics
write_pixels
```

### 1.5 设置Webhook
1. 在应用设置中，找到 **"Webhooks"**
2. 添加必需的webhook：
   ```
   URL: https://你的域名.vercel.app/api/webhooks/app/uninstalled
   事件: app/uninstalled
   ```

## 🚀 第二步：创建开发商店

1. 在Partner Dashboard中点击 **"商店"**
2. 点击 **"创建商店"**
3. 选择 **"开发商店"**
4. 填写商店信息（用于测试）

## 🚀 第三步：部署到Vercel

### 3.1 准备代码
```bash
# 将代码推送到GitHub
git add .
git commit -m "Initial Shopify app setup"
git push origin main
```

### 3.2 连接Vercel
1. 访问 [Vercel](https://vercel.com/)
2. 使用GitHub登录
3. 点击 **"Import Project"**
4. 选择您的GitHub仓库

### 3.3 配置环境变量
在Vercel项目设置中添加：
```bash
SHOPIFY_API_KEY=你的API_Key
SHOPIFY_API_SECRET=你的API_Secret  
SHOPIFY_APP_URL=https://你的项目名.vercel.app
SHOPIFY_DEV_STORE_URL=你的开发商店.myshopify.com
NODE_ENV=production
```

### 3.4 部署
点击 **"Deploy"** 开始部署

## 🚀 第四步：测试安装

1. 获取部署后的URL（如：https://你的项目名.vercel.app）
2. 构建安装URL：
   ```
   https://你的开发商店.myshopify.com/admin/oauth/authorize?client_id=你的API_KEY&scope=read_script_tags,write_script_tags,read_orders,read_analytics,write_pixels&redirect_uri=https://你的项目名.vercel.app/api/auth/callback&state=test
   ```
3. 在浏览器中访问这个URL
4. 确认安装授权
5. 验证重定向到应用页面 