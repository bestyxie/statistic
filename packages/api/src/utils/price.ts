/**
 * 从商品描述中提取价格
 * 支持多种价格格式：
 * - 第一个完整的数字（最高优先级）
 * - ¥12.50 / ￥12.50 (半角/全角人民币符号)
 * - 12.50元 / 12元
 * - P220 / p220 / 批220 / 💰220 (特殊前缀)
 * - 纯数字
 *
 * @param description 商品描述文本
 * @returns 提取到的价格字符串，如果未找到则返回空字符串
 */
export function extractPrice(description: string): string {
  if (!description || typeof description !== 'string') {
    return ''
  }

  // 价格匹配正则表达式，按优先级排序：
  const pricePatterns = [
    // 第一个完整的数字（最高优先级）
    /(\d{1,6}(?:\.\d{1,2})?)/,
    // P220 / p220 / P12.50 格式（P开头加数字，不区分大小写）
    /P(\d{1,6}(?:\.\d{1,2})?)/i,
    // 💰220 / 💰12.50 格式（钱袋表情符号加数字）
    /💰\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // 批220 / 批发220 / 批12.50 格式
    /批(?:发)?[:：]?\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // ¥12.50 或 ￥12.50 (半角/全角人民币符号)
    /[¥￥]\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // 12.50元 / 12元
    /(\d{1,6}(?:\.\d{1,2})?)\s*元/,
    // 价格:12.50 / 售价12.50 / 报价：12.50
    /(?:价格|售价|报价|批发价)[:：]?\s*(\d{1,6}(?:\.\d{1,2})?)/,
  ]

  for (const pattern of pricePatterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      const price = match[1]
      // 验证价格范围 (0.01 - 999999.99)
      const numPrice = parseFloat(price)
      if (numPrice > 0 && numPrice < 1000000) {
        return price
      }
    }
  }

  return ''
}

/**
 * 从商品描述中提取价格，并格式化为标准格式
 * 如果已有提供的价格，则优先使用提供的价格
 *
 * @param description 商品描述文本
 * @param existingPrice 已有的价格（如果存在）
 * @returns 格式化后的价格字符串
 */
export function getPriceWithFallback(description: string, existingPrice?: string): string {
  // 如果已有有效的价格，直接使用
  if (existingPrice && existingPrice.trim() !== '') {
    return existingPrice.trim()
  }

  // 否则从描述中提取
  return extractPrice(description)
}
