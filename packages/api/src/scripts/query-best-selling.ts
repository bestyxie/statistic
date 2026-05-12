import CryptoJS from 'crypto-js'

const URL =
  'https://gz.aliyizhan.com/visitor/queryBestSellingByConditionV2.action?marketCode=gz&equipUUID=d6d91048-0b2d-3907-87f3-2807aeb5cc9a'

const HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Linux; Android 12; ANA-AN00 Build/HUAWEIANA-AN00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0.4844.88 Mobile Safari/537.36 okhttp gxhy/3.2.8',
  cookie: 'JSESSIONID=81c44213-dfd9-49a0-8dda-6b8fe87bbe72;',
  'content-type': 'application/json; charset=UTF-8',
  accept: 'application/json, text/plain, */*',
}

const DEFAULT_KEY = 'wxtdefgabcdawn12'

function decrypt(cipherText: string): Record<string, unknown> {
  const keyBytes = CryptoJS.enc.Utf8.parse(DEFAULT_KEY)
  const decrypted = CryptoJS.AES.decrypt(cipherText, keyBytes, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.parse(CryptoJS.enc.Utf8.stringify(decrypted).toString())
}

export interface QueryParams {
  pageIndex: number
  searchType?: number
  searchDay?: number
  pageSize?: number
}

export async function queryBestSelling(params: QueryParams) {
  const body = {
    pageIndex: params.pageIndex,
    searchType: params.searchType ?? 1,
    searchDay: params.searchDay ?? 1,
    pageSize: params.pageSize ?? 30,
  }

  const resp = await fetch(URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })

  const text = await resp.text()

  try {
    return JSON.parse(text)
  } catch {
    return decrypt(text)
  }
}

// --- 查询商品访客列表 ---
const VISITOR_URL =
  'https://gz.aliyizhan.com/visitor/queryProductVisitorList.action?equipUUID=d6d91048-0b2d-3907-87f3-2807aeb5cc9a'

export interface VisitorQueryParams {
  /** 商品 code (sku) */
  visitorValue: string
  /** 搜索天数偏移，1=昨天 */
  searchDay?: number
  /** 搜索类型，固定 1 */
  searchType?: number
}

export async function queryProductVisitors(params: VisitorQueryParams) {
  const body = {
    pager: { pageIndex: 0 },
    searchType: params.searchType ?? 1,
    searchDay: params.searchDay ?? 1,
    visitorValue: params.visitorValue,
  }

  const resp = await fetch(VISITOR_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })

  const text = await resp.text()

  try {
    return JSON.parse(text)
  } catch {
    return decrypt(text)
  }
}
