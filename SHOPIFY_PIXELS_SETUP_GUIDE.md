# 🎯 Shopify Web Pixels扩展设置指南

## 📋 概述

本指南将帮助您在Shopify管理后台正确设置和启用Google Ads Web Pixels扩展。

---

## 🚀 详细设置步骤

### 第1步：确认应用安装状态

1. **检查应用是否已安装**
   - 登录Shopify管理后台
   - 导航到：**应用** → **已安装的应用**
   - 确认看到 **"Google Ads Pixel Tracker"** 应用

2. **验证应用配置**
   - 点击应用名称进入配置页面
   - 确认已填写Google Ads转化ID和标签
   - 状态显示为"已配置"

### 第2步：访问客户事件设置

1. **导航路径**
   ```
   Shopify管理后台 → 设置 → 客户事件
   ```

2. **页面位置**
   - 左侧菜单：**设置** (Settings)
   - 设置子菜单：**客户事件** (Customer events)

### 第3步：添加Web Pixels扩展

1. **点击添加像素**
   - 在客户事件页面，点击 **"添加像素"** 按钮
   - 如果是第一次添加，按钮可能显示为 **"连接像素"**

2. **选择像素类型**
   - 选择 **"应用"** (App) 选项卡
   - 不要选择"自定义像素"或"第三方像素"

3. **找到您的应用**
   - 在应用列表中找到 **"Google Ads Pixel Tracker"**
   - 点击应用名称或 **"添加"** 按钮

### 第4步：配置像素参数

配置窗口会显示以下字段：

```javascript
// 必填字段
转化ID (Conversion ID): AW-XXXXXXXXX
购买标签 (Purchase Label): your_purchase_label
加购标签 (Add to Cart Label): your_cart_label
结账标签 (Begin Checkout Label): your_checkout_label

// 可选字段
启用增强转化 (Enhanced Conversions): true/false
调试模式 (Debug Mode): true/false (仅开发环境)
```

**配置示例：**
```
转化ID: AW-123456789
购买标签: purchase_conversion
加购标签: add_to_cart
结账标签: begin_checkout
启用增强转化: 是
```

### 第5步：启用和验证

1. **启用像素**
   - 确保像素状态切换为 **"已启用"** (Enabled)
   - 点击 **"保存"** 按钮

2. **验证安装**
   - 刷新页面，确认像素显示在列表中
   - 状态应显示为 **"已连接"** 或 **"正常运行"**

---

## 🔍 验证扩展是否正常工作

### 方法1：使用浏览器开发者工具

1. **打开您的商店前台**
   - 访问：`https://你的商店名.myshopify.com`

2. **打开开发者工具**
   - 按 `F12` 或右键 → 检查元素
   - 切换到 **"控制台"** (Console) 标签

3. **查看像素加载日志**
   ```javascript
   // 正常情况下应该看到类似日志：
   [Google Ads Pixel] 扩展已加载
   [Google Ads Pixel] 配置已获取: AW-123456789
   [Google Ads Pixel] 事件监听器已注册
   ```

### 方法2：使用应用调试页面

1. **访问调试页面**
   - 在应用主页点击 **"查看调试信息"** 按钮
   - 或直接访问：`/api/debug?shop=你的商店名.myshopify.com`

2. **检查扩展状态**
   ```json
   {
     "webPixels": {
       "extensionInstalled": true,
       "configLoaded": true,
       "eventsRegistered": ["checkout_completed", "product_added_to_cart", "checkout_started"]
     }
   }
   ```

### 方法3：测试转化事件

1. **测试加购事件**
   - 在商店前台添加商品到购物车
   - 检查控制台是否有转化事件日志

2. **测试结账事件**
   - 进入结账页面
   - 验证结账开始事件是否触发

3. **测试购买事件**
   - 完成一个测试订单
   - 确认购买完成事件发送到Google Ads

---

## ⚠️ 常见问题解决

### 问题1：找不到"客户事件"选项

**原因**：您的Shopify计划可能不支持Web Pixels API

**解决方案**：
- 确保使用Shopify计划或以上版本
- Basic计划可能需要升级

### 问题2：应用列表中没有您的应用

**原因**：应用可能没有正确注册Web Pixels扩展

**解决方案**：
1. 检查 `extensions/google-ads-pixel/shopify.extension.toml` 文件
2. 确认扩展已正确部署
3. 重新安装应用

### 问题3：像素显示"未连接"状态

**原因**：扩展配置或网络问题

**解决方案**：
1. 检查应用配置是否正确
2. 验证Google Ads转化ID格式
3. 查看浏览器控制台错误信息

### 问题4：事件没有发送到Google Ads

**原因**：配置错误或网络问题

**解决方案**：
1. 验证转化标签是否正确
2. 检查Google Ads账户设置
3. 确认转化跟踪代码状态

---

## 📊 性能监控

### 监控指标

1. **像素加载时间**
   - 正常：< 500ms
   - 警告：500ms - 2s
   - 异常：> 2s

2. **事件发送成功率**
   - 优秀：> 95%
   - 良好：90% - 95%
   - 需要优化：< 90%

3. **转化数据准确性**
   - 定期对比Shopify订单和Google Ads转化数据
   - 误差范围应 < 5%

### 监控工具

1. **Shopify Analytics**
   - 查看客户事件统计
   - 监控像素性能指标

2. **Google Ads转化跟踪**
   - 检查转化数据接收情况
   - 验证转化价值准确性

3. **应用内监控**
   - 使用调试页面监控实时状态
   - 查看事件发送日志

---

## 🎯 最佳实践

### 配置建议

1. **转化标签命名**
   ```
   购买完成: purchase_[商店名]
   加购物车: add_to_cart_[商店名]
   开始结账: begin_checkout_[商店名]
   ```

2. **增强转化设置**
   - 启用增强转化以提高数据准确性
   - 确保符合隐私法规要求

3. **测试环境**
   - 在开发商店中充分测试
   - 验证所有事件类型正常工作

### 维护建议

1. **定期检查**
   - 每周检查像素状态
   - 监控转化数据准确性

2. **更新管理**
   - 及时更新应用版本
   - 关注Shopify API变更

3. **备份配置**
   - 记录所有配置参数
   - 建立配置恢复流程

---

## 📞 技术支持

如果您在设置过程中遇到问题：

1. **查看应用调试信息**
   - 访问 `/api/debug` 页面
   - 检查详细错误日志

2. **检查文档**
   - 参考 `docs/DEPLOYMENT_GUIDE.md`
   - 查看 `FINAL_FUNCTIONALITY_REPORT.md`

3. **联系支持**
   - 提供详细的错误信息
   - 包含商店域名和配置截图

---

**设置完成后，您的Google Ads转化追踪就会自动开始工作！** 🎉 