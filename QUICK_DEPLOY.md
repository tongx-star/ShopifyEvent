# ⚡ 5分钟快速部署指南

> 这是最简化的部署流程，适合想要快速上线的用户

## 🎯 部署目标
将您的Shopify Google Ads Pixel应用部署到生产环境，让商家可以安装和使用。

## 📋 前置要求
- [x] GitHub账号（代码已在仓库中）
- [ ] Shopify Partner账号
- [ ] Vercel账号

## 🚀 5步部署流程

### 步骤1: 创建Shopify Partner账号 (2分钟)
1. 访问 [Shopify Partners](https://partners.shopify.com/)
2. 注册并验证邮箱
3. 创建新应用：
   - 应用名称: `Google Ads Pixel Tracker`
   - 应用URL: `https://待填写.vercel.app`
   - 重定向URL: `https://待填写.vercel.app/api/auth/callback`
4. 记录API Key和API Secret

### 步骤2: 部署到Vercel (2分钟)
1. 访问 [Vercel](https://vercel.com/)
2. 用GitHub登录
3. 点击"Import Project" → 选择此仓库
4. 添加环境变量：
   ```
   SHOPIFY_API_KEY=你的API_Key
   SHOPIFY_API_SECRET=你的API_Secret
   SHOPIFY_APP_URL=https://将自动生成.vercel.app
   NODE_ENV=production
   ```
5. 点击"Deploy"，等待完成

### 步骤3: 更新Shopify配置 (1分钟)
1. 复制Vercel生成的URL（如：`https://shopify-event-abc123.vercel.app`）
2. 回到Shopify Partner Dashboard
3. 更新应用URL和重定向URL为实际地址
4. 添加权限：`read_script_tags,write_script_tags,read_orders,read_analytics,write_pixels`
5. 添加webhook：`https://你的域名.vercel.app/api/webhooks/app/uninstalled`

### 步骤4: 配置数据库 (可选，生产环境推荐)
1. 在Vercel项目中创建KV数据库
2. 添加KV环境变量并重新部署

### 步骤5: 测试部署 (1分钟)
1. 创建开发商店测试安装
2. 访问应用主页确认功能正常

## ✅ 部署完成！

现在您的应用已经成功部署，商家可以：
- 安装您的应用
- 配置Google Ads转化ID和标签
- 自动追踪购买、加购、结账事件

## 🎯 快速验证

访问您的应用URL，如果看到配置界面，说明部署成功！

## 📞 遇到问题？

- 查看详细指南: `docs/DEPLOYMENT_GUIDE.md`
- 使用检查清单: `deployment-checklist.md`
- 验证项目状态: `docs/PROJECT_VALIDATION.md`

---

**🎉 恭喜！您的Shopify应用已经成功部署并可以开始商业运营了！** 