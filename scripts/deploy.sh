#!/bin/bash

# 🚀 Shopify Google Ads Pixel应用部署脚本
# 这个脚本将指导您完成整个部署过程

echo "🚀 开始部署Shopify Google Ads Pixel应用"
echo "================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📋 检查部署依赖...${NC}"

# 检查git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git未安装，请先安装Git${NC}"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm未安装，请先安装Node.js和npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖检查完成${NC}"

# 检查项目构建
echo -e "${BLUE}🔨 测试项目构建...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 项目构建成功${NC}"
else
    echo -e "${RED}❌ 项目构建失败，请检查代码${NC}"
    exit 1
fi

# 检查Git状态
echo -e "${BLUE}📦 检查Git状态...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  有未提交的更改，正在提交...${NC}"
    git add .
    git commit -m "Auto commit before deployment"
    git push
else
    echo -e "${GREEN}✅ Git状态清洁，代码已同步${NC}"
fi

# 指导用户配置
echo ""
echo -e "${YELLOW}📝 接下来需要您手动完成以下步骤：${NC}"
echo ""

echo "1️⃣  创建Shopify Partner账号："
echo "   • 访问: https://partners.shopify.com/"
echo "   • 注册成为Shopify合作伙伴"
echo "   • 创建新的公共应用"
echo ""

echo "2️⃣  部署到Vercel："
echo "   • 访问: https://vercel.com/"
echo "   • 使用GitHub登录"
echo "   • 导入这个项目仓库"
echo "   • 获取部署URL"
echo ""

echo "3️⃣  配置环境变量："
echo "   在Vercel项目设置中添加以下变量："
echo "   SHOPIFY_API_KEY=你的API密钥"
echo "   SHOPIFY_API_SECRET=你的API秘钥"
echo "   SHOPIFY_APP_URL=你的Vercel部署URL"
echo "   NODE_ENV=production"
echo ""

echo "4️⃣  创建KV数据库："
echo "   • 在Vercel项目中创建KV数据库"
echo "   • 添加KV_REST_API_URL和KV_REST_API_TOKEN"
echo ""

echo "5️⃣  测试部署："
echo "   • 创建开发商店"
echo "   • 测试OAuth安装流程"
echo "   • 验证所有功能正常"
echo ""

# 生成配置模板
echo -e "${BLUE}📄 生成配置模板...${NC}"

cat > .env.example << EOF
# Shopify应用配置
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_APP_URL=https://your-app-domain.vercel.app

# Vercel KV数据库（生产环境）
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_rest_api_token

# 可选：开发环境设置
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com

# 环境设置
NODE_ENV=production
EOF

echo -e "${GREEN}✅ 配置模板已生成: .env.example${NC}"

# 创建部署检查清单
cat > deployment-checklist.md << EOF
# 🚀 部署检查清单

## ✅ 部署前准备
- [ ] 项目构建成功
- [ ] 代码已推送到GitHub
- [ ] 已创建Shopify Partner账号
- [ ] 已创建Shopify应用

## ✅ Vercel部署
- [ ] 已导入GitHub仓库到Vercel
- [ ] 已配置环境变量
- [ ] 部署成功并获取URL
- [ ] 已创建KV数据库

## ✅ Shopify配置
- [ ] 已更新应用URL和重定向URL
- [ ] 已配置应用权限
- [ ] 已设置webhook
- [ ] 已创建开发商店

## ✅ 功能测试
- [ ] OAuth安装流程正常
- [ ] 应用主页正常显示
- [ ] 配置功能正常工作
- [ ] 测试页面功能正常
- [ ] Google Ads代码生成正常

## ✅ 生产就绪
- [ ] 所有功能测试通过
- [ ] 性能监控已配置
- [ ] 错误处理正常
- [ ] 安全配置完整

完成所有检查项后，您的应用就成功部署了！
EOF

echo -e "${GREEN}✅ 部署检查清单已生成: deployment-checklist.md${NC}"

# 显示下一步操作
echo ""
echo -e "${GREEN}🎉 部署脚本执行完成！${NC}"
echo ""
echo -e "${YELLOW}📖 详细部署步骤请查看：${NC}"
echo "   • docs/DEPLOYMENT_GUIDE.md - 完整部署指南"
echo "   • deployment-checklist.md - 部署检查清单"
echo "   • .env.example - 环境变量模板"
echo ""
echo -e "${BLUE}🔗 有用的链接：${NC}"
echo "   • Shopify Partners: https://partners.shopify.com/"
echo "   • Vercel: https://vercel.com/"
echo "   • 项目文档: ./README.md"
echo ""
echo -e "${GREEN}💡 提示: 按照 docs/DEPLOYMENT_GUIDE.md 中的步骤完成部署${NC}"
echo "===========================================================" 