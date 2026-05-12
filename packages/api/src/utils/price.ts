/**
 * 从商品描述中提取价格
 * 支持多种价格格式（按优先级从高到低）：
 * - P220 / p220 / 💰220 / 批220 等特殊前缀
 * - ¥12.50 / 12元 等货币标记
 * - 描述开头的数字（最低优先级）
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
    // 价格:12.50 / 售价12.50 / 报价：12.50
    /(?:价格|售价|报价|批发价)[:：]?\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // ¥12.50 或 ￥12.50 (半角/全角人民币符号)
    /[¥￥]\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // 12.50元 / 12元
    /(\d{1,6}(?:\.\d{1,2})?)\s*元/,
    // P220 / p220 / P12.50 格式（P开头加数字，不区分大小写）
    /P(\d{1,6}(?:\.\d{1,2})?)/i,
    // 💰220 / 💰12.50 格式（钱袋表情符号加数字）
    /💰\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // 批220 / 批发220 / 批12.50 格式
    /批(?:发)?[:：]?\s*(\d{1,6}(?:\.\d{1,2})?)/,
    // 描述开头的数字（最低优先级，兜底）
    /^(\d{1,6}(?:\.\d{1,2})?)/,
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
 * 从第三方接口获取商品价格
 * @param code 商品 code (sku)
 * @returns 价格字符串，获取失败返回空字符串
 */
export async function fetchPriceFromApi(code: string): Promise<string> {
  if (!code) return ''

  try {
    const { queryProductDetail } = await import('../scripts/query-best-selling')
    const result = await queryProductDetail(code)
    const price = result?.data?.product?.price
    if (price && Number(price) > 0) {
      return String(price)
    }
  } catch {
    // 接口不可用时静默失败
  }

  return ''
}

/**
 * 从商品描述中提取价格，如果提取不到则从第三方接口获取
 *
 * @param description 商品描述文本
 * @param code 商品 code (sku)，用于第三方接口查询
 * @returns 价格字符串
 */
export async function extractPriceWithApi(description: string, code?: string): Promise<string> {
  const fromDesc = extractPrice(description)
  if (fromDesc) return fromDesc

  if (code) {
    return fetchPriceFromApi(code)
  }

  return ''
}

/**
 * 从商品描述中提取价格，并格式化为标准格式
 * 如果已有提供的价格，则优先使用提供的价格
 * 如果都没有，从第三方接口获取
 *
 * @param description 商品描述文本
 * @param existingPrice 已有的价格（如果存在）
 * @param code 商品 code (sku)，用于第三方接口查询
 * @returns 价格字符串
 */
export async function getPriceWithFallback(description: string, existingPrice?: string, code?: string): Promise<string> {
  if (existingPrice && existingPrice.trim() !== '') {
    return existingPrice.trim()
  }

  const fromDesc = extractPrice(description)
  if (fromDesc) return fromDesc

  if (code) {
    return fetchPriceFromApi(code)
  }

  return ''
}
