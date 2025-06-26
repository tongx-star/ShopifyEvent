# Google Ads转化测试完整指南

## 🎯 测试目标

确保你的Shopify应用能够成功将转化事件发送到Google Ads，并在Google Ads后台看到数据。

## 📋 测试前准备

### 1. Google Ads账号设置

#### 创建转化操作
1. 登录 [Google Ads](https://ads.google.com)
2. 导航到 **工具和设置** → **转化**
3. 点击 **+ 新转化操作**
4. 选择 **网站**
5. 配置转化操作：

```
转化名称: Shopify购买
类别: 购买
价值: 使用转化值
计算方式: 每次转化
转化时间窗口: 30天
浏览转化时间窗口: 1天
归因模型: 以数据为准
```

6. 创建完成后，记录下：
   - **转化ID**: `AW-123456789` (示例)
   - **转化标签**: `abc123def` (示例)

#### 获取转化跟踪代码
```javascript
<!-- Google Ads转化跟踪代码示例 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-123456789"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-123456789');
</script>

<!-- 购买事件 -->
<script>
  gtag('event', 'conversion', {
    'send_to': 'AW-123456789/abc123def',
    'value': 99.99,
    'currency': 'USD',
    'transaction_id': 'unique_order_id'
  });
</script>
```

### 2. 应用配置

在你的应用中配置真实的Google Ads信息：

```bash
# 更新配置
curl -X POST "http://localhost:3000/api/config?shop=demo-shop.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "googleAds": {
      "conversionId": "AW-123456789",
      "purchaseLabel": "abc123def",
      "addToCartLabel": "def456ghi",
      "beginCheckoutLabel": "ghi789jkl"
    },
    "enabledEvents": ["purchase", "add_to_cart", "begin_checkout"]
  }'
```

## 🧪 测试步骤

### 1. 基础功能测试

#### 访问测试页面
```
http://localhost:3000/test
```

#### 执行测试步骤
1. **加载Pixel代码**
   - 点击"加载Pixel代码"按钮
   - 确认日志显示"✅ Pixel代码加载成功"
   - 检查浏览器控制台是否有错误

2. **检查Google gtag**
   - 点击"检查Google gtag"按钮
   - 确认gtag已加载
   - 查看dataLayer数据

3. **发送测试事件**
   - 配置测试参数（金额、货币等）
   - 点击"🚀 发送测试事件"
   - 观察日志和控制台输出

### 2. 网络请求验证

#### 使用浏览器开发者工具
1. 打开 **F12** 开发者工具
2. 切换到 **Network** 标签
3. 清空现有请求
4. 发送测试事件
5. 查看网络请求：

**期望看到的请求：**
```
# Google Analytics收集请求
GET https://www.google-analytics.com/g/collect?...

# 或者Google Ads服务请求
POST https://googleadservices.com/pagead/conversion/...

# 请求参数应包含：
- tid: AW-123456789
- t: event
- en: conversion
- tr: 99.99 (转化值)
- cu: USD (货币)
- tid: unique_transaction_id
```

### 3. Google Tag Assistant验证

#### 安装Chrome扩展
1. 安装 [Google Tag Assistant Legacy](https://chrome.google.com/webstore)
2. 访问测试页面
3. 启用Tag Assistant
4. 发送测试事件
5. 查看Tag Assistant报告

**期望结果：**
- ✅ Google Ads转化标签触发
- ✅ 转化值正确传递
- ✅ 无错误或警告

### 4. Google Ads后台验证

#### 实时转化测试
1. 登录Google Ads
2. 导航到 **工具和设置** → **转化**
3. 点击你创建的转化操作
4. 查看 **诊断** 部分
5. 发送测试事件后，等待5-10分钟
6. 检查是否有新的转化记录

**注意事项：**
- 测试转化可能需要几分钟才会显示
- 确保使用不同的transaction_id
- 检查转化值和货币是否正确

## 🔍 高级测试

### 1. 增强转化测试

如果启用了增强转化，需要测试用户数据传递：

```javascript
// 增强转化数据
gtag('event', 'conversion', {
  'send_to': 'AW-123456789/abc123def',
  'value': 99.99,
  'currency': 'USD',
  'transaction_id': 'unique_order_id',
  // 增强转化数据
  'email': 'test@example.com',
  'phone_number': '+1234567890',
  'first_name': 'John',
  'last_name': 'Doe',
  'country': 'US',
  'postal_code': '12345'
});
```

### 2. 多事件类型测试

分别测试不同类型的转化：

```bash
# 购买转化
curl -X POST "http://localhost:3000/api/test-event" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "purchase", "value": 99.99}'

# 加购转化
curl -X POST "http://localhost:3000/api/test-event" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "add_to_cart", "value": 29.99}'

# 开始结账转化
curl -X POST "http://localhost:3000/api/test-event" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "begin_checkout", "value": 149.99}'
```

### 3. 错误场景测试

测试各种错误情况：

```bash
# 无效的转化ID
curl -X POST "http://localhost:3000/api/config?shop=demo-shop.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"googleAds": {"conversionId": "INVALID_ID"}}'

# 空值测试
curl -X POST "http://localhost:3000/api/test-event" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "purchase", "value": null}'
```

## 📊 数据验证

### 1. 服务器端验证

检查应用服务器的事件记录：

```bash
# 获取事件统计
curl "http://localhost:3000/api/events?shop=demo-shop.myshopify.com" \
  -X PUT | jq .

# 获取事件列表
curl "http://localhost:3000/api/events?shop=demo-shop.myshopify.com" | jq .
```

### 2. Google Ads报告验证

1. **转化报告**
   - 导航到 **报告** → **转化**
   - 查看转化数量和价值
   - 验证时间戳和归因

2. **审核日志**
   - 导航到 **工具和设置** → **变更历史记录**
   - 查看转化标签活动

## 🚨 常见问题排查

### 1. 转化未记录
**可能原因：**
- 转化ID或标签错误
- 重复的transaction_id
- 时间窗口设置问题
- 广告拦截器干扰

**解决方案：**
```bash
# 检查配置
curl "http://localhost:3000/api/config?shop=demo-shop.myshopify.com" | jq .

# 使用唯一ID
transaction_id=$(date +%s)
curl -X POST "http://localhost:3000/api/test-event" \
  -H "Content-Type: application/json" \
  -d "{\"eventType\": \"purchase\", \"transactionId\": \"test_$transaction_id\"}"
```

### 2. 网络请求失败
**检查项目：**
- CORS设置
- 网络连接
- 防火墙设置
- 广告拦截器

### 3. 数据不匹配
**验证步骤：**
- 确认转化值格式（数字）
- 检查货币代码（3位ISO代码）
- 验证事件时间戳
- 确认conversion action设置

## 📈 性能监控

### 1. 设置监控

```javascript
// 添加性能监控
gtag('event', 'timing_complete', {
  'name': 'conversion_tracking',
  'value': performance.now()
});
```

### 2. 错误跟踪

```javascript
// 添加错误处理
window.addEventListener('error', function(e) {
  console.error('Conversion tracking error:', e);
  // 发送错误报告到服务器
});
```

## 🎯 测试检查清单

### ✅ 基础测试
- [ ] Pixel代码成功加载
- [ ] Google gtag正确初始化
- [ ] 事件监听器注册成功
- [ ] 测试事件能够发送
- [ ] 网络请求正常发出

### ✅ 数据验证
- [ ] 转化值正确传递
- [ ] 货币代码正确
- [ ] 交易ID唯一
- [ ] 时间戳准确

### ✅ Google Ads验证
- [ ] 转化在后台显示
- [ ] 转化价值正确
- [ ] 归因数据准确
- [ ] 重复检测正常

### ✅ 错误处理
- [ ] 无效配置被拒绝
- [ ] 网络错误正确处理
- [ ] 重复转化被过滤
- [ ] 错误日志完整

完成以上所有测试后，你的Google Ads转化追踪功能就可以确保正常工作了！ 