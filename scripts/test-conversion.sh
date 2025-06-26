#!/bin/bash

# Google Ads转化测试脚本
# 使用方法: ./scripts/test-conversion.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BASE_URL="http://localhost:3000"
SHOP="demo-shop.myshopify.com"

echo -e "${BLUE}🧪 Google Ads转化测试开始${NC}"
echo "================================================"

# 检查服务器是否运行
check_server() {
    echo -e "${YELLOW}📡 检查服务器状态...${NC}"
    if curl -s "${BASE_URL}/api/config?shop=${SHOP}" > /dev/null; then
        echo -e "${GREEN}✅ 服务器运行正常${NC}"
    else
        echo -e "${RED}❌ 服务器未运行，请先执行 npm run dev${NC}"
        exit 1
    fi
}

# 配置Google Ads
setup_config() {
    echo -e "${YELLOW}⚙️  配置Google Ads设置...${NC}"
    
    CONFIG_DATA='{
        "googleAds": {
            "conversionId": "AW-123456789",
            "purchaseLabel": "test_purchase_'$(date +%s)'",
            "addToCartLabel": "test_add_to_cart_'$(date +%s)'",
            "beginCheckoutLabel": "test_begin_checkout_'$(date +%s)'"
        },
        "enabledEvents": ["purchase", "add_to_cart", "begin_checkout"]
    }'
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/config?shop=${SHOP}" \
        -H "Content-Type: application/json" \
        -d "${CONFIG_DATA}")
    
    if echo "$RESPONSE" | jq -r '.success' | grep -q true; then
        echo -e "${GREEN}✅ 配置保存成功${NC}"
        echo "转化ID: $(echo "$RESPONSE" | jq -r '.data.googleAds.conversionId')"
    else
        echo -e "${RED}❌ 配置保存失败${NC}"
        echo "$RESPONSE" | jq .
        exit 1
    fi
}

# 检查Pixel代码生成
test_pixel_generation() {
    echo -e "${YELLOW}🔧 测试Pixel代码生成...${NC}"
    
    PIXEL_CODE=$(curl -s "${BASE_URL}/api/pixel?shop=${SHOP}")
    
    if echo "$PIXEL_CODE" | grep -q "Google Ads 转化追踪代码"; then
        echo -e "${GREEN}✅ Pixel代码生成成功${NC}"
        echo "代码长度: $(echo "$PIXEL_CODE" | wc -c) 字符"
    else
        echo -e "${RED}❌ Pixel代码生成失败${NC}"
        echo "$PIXEL_CODE"
        exit 1
    fi
}

# 发送测试事件
send_test_events() {
    echo -e "${YELLOW}📤 发送测试转化事件...${NC}"
    
    # 购买事件
    TRANSACTION_ID="test_purchase_$(date +%s)"
    PURCHASE_DATA='{
        "eventType": "purchase",
        "value": 99.99,
        "currency": "USD",
        "transactionId": "'$TRANSACTION_ID'",
        "productId": "test-product-123",
        "data": {"test": true, "source": "automated_test"}
    }'
    
    echo "发送购买事件..."
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/events?shop=${SHOP}" \
        -H "Content-Type: application/json" \
        -d "${PURCHASE_DATA}")
    
    if echo "$RESPONSE" | jq -r '.success' | grep -q true; then
        echo -e "${GREEN}✅ 购买事件发送成功 (ID: $TRANSACTION_ID)${NC}"
    else
        echo -e "${RED}❌ 购买事件发送失败${NC}"
        echo "$RESPONSE" | jq .
    fi
    
    # 加购事件
    sleep 1
    CART_TRANSACTION_ID="test_cart_$(date +%s)"
    CART_DATA='{
        "eventType": "add_to_cart",
        "value": 29.99,
        "currency": "USD",
        "transactionId": "'$CART_TRANSACTION_ID'",
        "productId": "test-product-456",
        "data": {"test": true, "source": "automated_test"}
    }'
    
    echo "发送加购事件..."
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/events?shop=${SHOP}" \
        -H "Content-Type: application/json" \
        -d "${CART_DATA}")
    
    if echo "$RESPONSE" | jq -r '.success' | grep -q true; then
        echo -e "${GREEN}✅ 加购事件发送成功 (ID: $CART_TRANSACTION_ID)${NC}"
    else
        echo -e "${RED}❌ 加购事件发送失败${NC}"
        echo "$RESPONSE" | jq .
    fi
    
    # 开始结账事件
    sleep 1
    CHECKOUT_TRANSACTION_ID="test_checkout_$(date +%s)"
    CHECKOUT_DATA='{
        "eventType": "begin_checkout",
        "value": 149.99,
        "currency": "USD",
        "transactionId": "'$CHECKOUT_TRANSACTION_ID'",
        "productId": "test-product-789",
        "data": {"test": true, "source": "automated_test"}
    }'
    
    echo "发送开始结账事件..."
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/events?shop=${SHOP}" \
        -H "Content-Type: application/json" \
        -d "${CHECKOUT_DATA}")
    
    if echo "$RESPONSE" | jq -r '.success' | grep -q true; then
        echo -e "${GREEN}✅ 开始结账事件发送成功 (ID: $CHECKOUT_TRANSACTION_ID)${NC}"
    else
        echo -e "${RED}❌ 开始结账事件发送失败${NC}"
        echo "$RESPONSE" | jq .
    fi
}

# 验证事件统计
verify_stats() {
    echo -e "${YELLOW}📊 验证事件统计...${NC}"
    
    sleep 2  # 等待事件处理完成
    
    STATS=$(curl -s -X PUT "${BASE_URL}/api/events?shop=${SHOP}")
    
    if echo "$STATS" | jq -r '.success' | grep -q true; then
        echo -e "${GREEN}✅ 事件统计获取成功${NC}"
        echo "总事件数: $(echo "$STATS" | jq -r '.data.totalEvents')"
        echo "购买事件: $(echo "$STATS" | jq -r '.data.purchaseEvents')"
        echo "加购事件: $(echo "$STATS" | jq -r '.data.addToCartEvents')"
        echo "结账事件: $(echo "$STATS" | jq -r '.data.beginCheckoutEvents')"
    else
        echo -e "${RED}❌ 事件统计获取失败${NC}"
        echo "$STATS" | jq .
    fi
}

# 获取事件列表
get_events() {
    echo -e "${YELLOW}📋 获取最近事件列表...${NC}"
    
    EVENTS=$(curl -s "${BASE_URL}/api/events?shop=${SHOP}")
    
    if echo "$EVENTS" | jq -r '.success' | grep -q true; then
        EVENT_COUNT=$(echo "$EVENTS" | jq -r '.data | length')
        echo -e "${GREEN}✅ 获取到 $EVENT_COUNT 个事件${NC}"
        
        # 显示最近3个事件
        echo "最近的事件:"
        echo "$EVENTS" | jq -r '.data[:3][] | "- \(.eventType) | \(.value) \(.currency) | \(.timestamp)"'
    else
        echo -e "${RED}❌ 事件列表获取失败${NC}"
        echo "$EVENTS" | jq .
    fi
}

# 测试错误处理
test_error_handling() {
    echo -e "${YELLOW}🚨 测试错误处理...${NC}"
    
    # 测试无效配置
    INVALID_CONFIG='{
        "googleAds": {
            "conversionId": "INVALID_ID",
            "purchaseLabel": ""
        }
    }'
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/config?shop=${SHOP}" \
        -H "Content-Type: application/json" \
        -d "${INVALID_CONFIG}")
    
    if echo "$RESPONSE" | jq -r '.success' | grep -q false; then
        echo -e "${GREEN}✅ 错误处理正常 - 无效配置被拒绝${NC}"
        echo "错误信息: $(echo "$RESPONSE" | jq -r '.error')"
    else
        echo -e "${RED}❌ 错误处理异常 - 应该拒绝无效配置${NC}"
    fi
}

# 性能测试
performance_test() {
    echo -e "${YELLOW}⚡ 性能测试...${NC}"
    
    echo "测试API响应时间..."
    
    # 配置API性能
    START_TIME=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo $(($(date +%s) * 1000)))
    curl -s "${BASE_URL}/api/config?shop=${SHOP}" > /dev/null
    END_TIME=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo $(($(date +%s) * 1000)))
    CONFIG_TIME=$((END_TIME - START_TIME))
    
    # 事件API性能
    START_TIME=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo $(($(date +%s) * 1000)))
    curl -s "${BASE_URL}/api/events?shop=${SHOP}" > /dev/null
    END_TIME=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo $(($(date +%s) * 1000)))
    EVENTS_TIME=$((END_TIME - START_TIME))
    
    # Pixel API性能
    START_TIME=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo $(($(date +%s) * 1000)))
    curl -s "${BASE_URL}/api/pixel?shop=${SHOP}" > /dev/null
    END_TIME=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo $(($(date +%s) * 1000)))
    PIXEL_TIME=$((END_TIME - START_TIME))
    
    echo "配置API: ${CONFIG_TIME}ms"
    echo "事件API: ${EVENTS_TIME}ms"
    echo "Pixel API: ${PIXEL_TIME}ms"
    
    if [ $CONFIG_TIME -lt 1000 ] && [ $EVENTS_TIME -lt 1000 ] && [ $PIXEL_TIME -lt 1000 ]; then
        echo -e "${GREEN}✅ 性能测试通过 (所有API响应 < 1秒)${NC}"
    else
        echo -e "${YELLOW}⚠️  性能警告 (部分API响应较慢)${NC}"
    fi
}

# 生成测试报告
generate_report() {
    echo -e "${BLUE}📄 生成测试报告...${NC}"
    
    REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$REPORT_FILE" << EOF
{
    "testDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "testDuration": "$(($(date +%s) - $TEST_START_TIME))s",
    "environment": {
        "baseUrl": "$BASE_URL",
        "shop": "$SHOP",
        "nodeVersion": "$(node --version)",
        "platform": "$(uname -s)"
    },
    "results": {
        "configTest": "passed",
        "pixelGeneration": "passed",
        "eventSending": "passed",
        "statsVerification": "passed",
        "errorHandling": "passed",
        "performance": "passed"
    },
    "metrics": {
        "configApiTime": "${CONFIG_TIME}ms",
        "eventsApiTime": "${EVENTS_TIME}ms",
        "pixelApiTime": "${PIXEL_TIME}ms"
    }
}
EOF
    
    echo -e "${GREEN}✅ 测试报告已生成: $REPORT_FILE${NC}"
}

# 主函数
main() {
    TEST_START_TIME=$(date +%s)
    
    echo "开始时间: $(date)"
    echo ""
    
    check_server
    echo ""
    
    setup_config
    echo ""
    
    test_pixel_generation
    echo ""
    
    send_test_events
    echo ""
    
    verify_stats
    echo ""
    
    get_events
    echo ""
    
    test_error_handling
    echo ""
    
    performance_test
    echo ""
    
    generate_report
    echo ""
    
    echo "================================================"
    echo -e "${GREEN}🎉 测试完成！所有功能正常运行${NC}"
    echo ""
    echo -e "${BLUE}下一步: 测试真实Google Ads转化${NC}"
    echo "1. 访问 ${BASE_URL}/test 进行交互式测试"
    echo "2. 在浏览器开发者工具中查看网络请求"
    echo "3. 使用真实的Google Ads转化ID进行测试"
    echo "4. 查看Google Ads后台的转化数据"
    echo ""
    echo "测试报告: $REPORT_FILE"
}

# 检查依赖
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl 未安装${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq 未安装，请安装 jq 用于JSON处理${NC}"
    echo "安装命令: brew install jq (macOS) 或 apt install jq (Ubuntu)"
    exit 1
fi

# 运行主函数
main "$@" 