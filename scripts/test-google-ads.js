#!/usr/bin/env node

/**
 * Google Ads 转化追踪测试脚本
 * 使用真实的转化ID和标签测试事件发送
 */

const http = require('http')
const querystring = require('querystring')

// 测试配置
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  SHOP: 'demo-shop.myshopify.com',
  CONVERSION_ID: 'AW-11403892942',
  PURCHASE_LABEL: 'zx0XCKPZic0ZEM6x5r0q'
}

// 颜色输出
const colors = {
  red: '\033[31m',
  green: '\033[32m', 
  yellow: '\033[33m',
  blue: '\033[34m',
  reset: '\033[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 发送HTTP请求
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }

    const req = http.request(requestOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ ok: res.statusCode === 200, data: parsed, status: res.statusCode })
        } catch (e) {
          resolve({ ok: res.statusCode === 200, data: data, status: res.statusCode, raw: data })
        }
      })
    })

    req.on('error', reject)
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

// 步骤1：验证配置
async function step1_verifyConfig() {
  log('\n🔧 步骤 1: 验证Google Ads配置', 'blue')
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/config?shop=${TEST_CONFIG.SHOP}`)
    
    if (response.ok && response.data.success && response.data.data) {
      const config = response.data.data
      log('✅ 配置读取成功', 'green')
      log(`   转化ID: ${config.googleAds.conversionId}`, 'blue')
      log(`   购买标签: ${config.googleAds.purchaseLabel}`, 'blue')
      
      // 验证配置是否正确
      if (config.googleAds.conversionId === TEST_CONFIG.CONVERSION_ID &&
          config.googleAds.purchaseLabel === TEST_CONFIG.PURCHASE_LABEL) {
        log('✅ 配置匹配正确', 'green')
        return true
      } else {
        log('⚠️  配置不匹配，将更新配置', 'yellow')
        return false
      }
    } else {
      log('❌ 配置读取失败', 'red')
      return false
    }
  } catch (error) {
    log(`❌ 配置验证失败: ${error.message}`, 'red')
    return false
  }
}

// 步骤2：更新配置（如果需要）
async function step2_updateConfig() {
  log('\n⚙️  步骤 2: 更新Google Ads配置', 'blue')
  
  const configData = {
    googleAds: {
      conversionId: TEST_CONFIG.CONVERSION_ID,
      purchaseLabel: TEST_CONFIG.PURCHASE_LABEL,
      addToCartLabel: '',
      beginCheckoutLabel: '',
      enhancedConversions: false
    },
    enabledEvents: ['purchase']
  }

  try {
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/config?shop=${TEST_CONFIG.SHOP}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    })
    
    if (response.ok && response.data.success) {
      log('✅ 配置更新成功', 'green')
      return true
    } else {
      log(`❌ 配置更新失败: ${response.data?.error || '未知错误'}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ 配置更新失败: ${error.message}`, 'red')
    return false
  }
}

// 步骤3：验证Pixel代码生成
async function step3_verifyPixelCode() {
  log('\n📟 步骤 3: 验证Pixel代码生成', 'blue')
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/pixel?shop=${TEST_CONFIG.SHOP}`)
    
    if (response.ok && response.raw) {
      const pixelCode = response.raw
      
      // 检查关键信息
      const hasConversionId = pixelCode.includes(TEST_CONFIG.CONVERSION_ID)
      const hasPurchaseLabel = pixelCode.includes(TEST_CONFIG.PURCHASE_LABEL)
      const hasGtag = pixelCode.includes('gtag')
      
      log('✅ Pixel代码生成成功', 'green')
      log(`   包含转化ID: ${hasConversionId ? '✅' : '❌'}`, hasConversionId ? 'green' : 'red')
      log(`   包含购买标签: ${hasPurchaseLabel ? '✅' : '❌'}`, hasPurchaseLabel ? 'green' : 'red')
      log(`   包含gtag函数: ${hasGtag ? '✅' : '❌'}`, hasGtag ? 'green' : 'red')
      
      if (hasConversionId && hasPurchaseLabel && hasGtag) {
        log('✅ Pixel代码验证通过', 'green')
        return true
      } else {
        log('❌ Pixel代码验证失败', 'red')
        return false
      }
    } else {
      log('❌ Pixel代码生成失败', 'red')
      return false
    }
  } catch (error) {
    log(`❌ Pixel代码验证失败: ${error.message}`, 'red')
    return false
  }
}

// 步骤4：测试事件发送
async function step4_testEventSending() {
  log('\n🚀 步骤 4: 测试转化事件发送', 'blue')
  
  const testEvent = {
    event: 'purchase',
    data: {
      send_to: `${TEST_CONFIG.CONVERSION_ID}/${TEST_CONFIG.PURCHASE_LABEL}`,
      value: 99.99,
      currency: 'USD',
      transaction_id: `test_${Date.now()}`
    },
    timestamp: new Date().toISOString()
  }

  try {
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/events?shop=${TEST_CONFIG.SHOP}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEvent)
    })
    
    if (response.ok && response.data.success) {
      log('✅ 测试事件发送成功', 'green')
      log(`   事件ID: ${testEvent.data.transaction_id}`, 'blue')
      log(`   转化值: ${testEvent.data.value} ${testEvent.data.currency}`, 'blue')
      return true
    } else {
      log(`❌ 测试事件发送失败: ${response.data?.error || '未知错误'}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ 测试事件发送失败: ${error.message}`, 'red')
    return false
  }
}

// 步骤5：显示调试信息
async function step5_showDebugInfo() {
  log('\n🔍 步骤 5: 显示调试信息', 'blue')
  
  log('📋 Google Ads配置信息:', 'yellow')
  log(`   转化ID: ${TEST_CONFIG.CONVERSION_ID}`, 'blue')
  log(`   购买标签: ${TEST_CONFIG.PURCHASE_LABEL}`, 'blue')
  log(`   完整send_to: ${TEST_CONFIG.CONVERSION_ID}/${TEST_CONFIG.PURCHASE_LABEL}`, 'blue')
  
  log('\n📊 验证步骤:', 'yellow')
  log('1. 在浏览器中访问: http://localhost:3000/test', 'blue')
  log('2. 点击"加载Pixel代码"按钮', 'blue')
  log('3. 发送测试事件并查看控制台日志', 'blue')
  log('4. 在Google Ads中检查转化数据（可能需要几分钟）', 'blue')
  
  log('\n🌐 网络验证:', 'yellow')
  log('在浏览器开发者工具的Network面板中查找:', 'blue')
  log('- gtag/js 脚本加载请求', 'blue')
  log('- google-analytics.com/g/collect 事件发送请求', 'blue')
  
  return true
}

// 主函数
async function main() {
  log('🧪 Google Ads 转化追踪测试工具', 'green')
  log('=====================================', 'green')
  
  try {
    // 步骤1：验证配置
    const configValid = await step1_verifyConfig()
    
    // 步骤2：如果配置无效，更新配置
    if (!configValid) {
      const updateSuccess = await step2_updateConfig()
      if (!updateSuccess) {
        log('\n❌ 测试失败：无法更新配置', 'red')
        process.exit(1)
      }
    }
    
    // 步骤3：验证Pixel代码
    const pixelValid = await step3_verifyPixelCode()
    if (!pixelValid) {
      log('\n❌ 测试失败：Pixel代码验证失败', 'red')
      process.exit(1)
    }
    
    // 步骤4：测试事件发送
    const eventValid = await step4_testEventSending()
    if (!eventValid) {
      log('\n⚠️  警告：事件发送测试失败，但Pixel代码生成正常', 'yellow')
    }
    
    // 步骤5：显示调试信息
    await step5_showDebugInfo()
    
    log('\n🎉 测试完成！', 'green')
    log('如果所有步骤都成功，您的Google Ads转化追踪已正确配置。', 'green')
    log('请在实际的Shopify商店中测试购买流程以验证转化数据。', 'yellow')
    
  } catch (error) {
    log(`\n💥 测试过程中发生错误: ${error.message}`, 'red')
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  main()
}

module.exports = { main, TEST_CONFIG } 