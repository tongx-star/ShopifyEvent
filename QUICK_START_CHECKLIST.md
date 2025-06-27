# 🚀 快速启动操作清单

## ✅ 当前状态

- ✅ **Next.js应用**: 运行在 http://localhost:3000
- ✅ **Shopify CLI**: 正在启动隧道连接
- ✅ **应用配置**: CESHI (ID: 7fe053e33eb0b7215a17ba32ad156fb2)
- ✅ **Web Pixels扩展**: 已配置

## 📋 您需要执行的操作

### 第1步：获取Shopify CLI访问链接 ⏰ 2分钟

等待Shopify CLI完全启动后，它会显示类似这样的信息：
```
┌─ web ────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Your app is running at: https://xxxxx.ngrok.io                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ GraphiQL ───────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Explore the Shopify Admin API: https://xxxxx.ngrok.io/graphiql             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ your development store ─────────────────────────────────────────────────────┐
│                                                                              │
│  Preview your app: https://your-dev-store.myshopify.com/admin/apps/ceshi-25 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**复制"Preview your app"链接**，这就是您的应用访问地址！

### 第2步：安装应用到开发商店 ⏰ 1分钟

1. 点击上面的"Preview your app"链接
2. 点击"安装应用"按钮
3. 授权必要权限
4. 等待安装完成

### 第3步：配置Google Ads设置 ⏰ 2分钟

在应用界面中：
1. 输入测试转化ID：`AW-123456789`
2. 输入购买标签：`purchase_test`
3. 输入购物车标签：`cart_test`
4. 输入结账标签：`checkout_test`
5. 启用增强转化
6. 点击"保存配置"

### 第4步：启用Web Pixels扩展 ⏰ 3分钟

1. 在开发商店管理后台，导航到：
   ```
   设置 → 客户事件 (Settings → Customer events)
   ```

2. 点击"添加像素"或"Connect pixel"

3. 在"应用"选项卡中找到"Google Ads Conversion Tracking"

4. 点击"连接"

5. 配置扩展设置（与第3步相同的值）

6. 点击"保存"

### 第5步：测试转化追踪 ⏰ 5分钟

1. **访问开发商店前台**（通常是 your-dev-store.myshopify.com）

2. **打开浏览器开发者工具**（F12）

3. **切换到Network标签页**

4. **执行购物测试**：
   - 添加商品到购物车 → 查看是否有Google Analytics请求
   - 开始结账流程 → 查看转化事件
   - 完成模拟购买 → 验证purchase事件

5. **验证成功标志**：
   - Network中看到 `google-analytics.com` 请求
   - 请求包含转化ID和标签
   - Console中无错误信息

## 🔧 故障排除

### 问题1：CLI没有显示访问链接
```bash
# 重启CLI
Ctrl+C (停止当前进程)
shopify app dev --port=3000
```

### 问题2：应用无法安装
- 确保开发商店处于开发模式
- 检查网络连接
- 尝试刷新页面

### 问题3：扩展未出现在客户事件中
```bash
# 重新部署扩展
shopify app deploy
```

### 问题4：转化事件未发送
1. 检查浏览器控制台错误
2. 验证扩展配置是否正确
3. 确保转化ID格式正确 (AW-xxxxxxxxx)

## 📊 成功验证

当您看到以下情况时，说明配置成功：

- ✅ 应用成功安装到开发商店
- ✅ Web Pixels扩展在客户事件中显示为"已连接"
- ✅ 购物测试时Network中出现Google Analytics请求
- ✅ 转化事件包含正确的ID和标签
- ✅ 无JavaScript错误

## 🎯 下一步

测试成功后：
1. 配置真实的Google Ads转化ID
2. 部署到生产环境
3. 在真实商店中安装应用
4. 监控Google Ads后台的转化数据

---

**需要帮助？** 查看终端输出获取实时状态，或检查 `SHOPIFY_CLI_TEST_GUIDE.md` 获取详细说明。 