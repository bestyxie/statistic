import CryptoJS from 'crypto-js'
import type { Shop, Product, DashboardData, ExternalProduct, ExternalData, Visitor, ProductLabel } from '@statistic/shared'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const ENCRYPT_KEY = 'wxtdefgabcdawn12'

// 全局导航回调，用于处理 401 跳转
let navigateToLogin: (() => void) | null = null

export function setNavigateToLogin(fn: () => void) {
  navigateToLogin = fn
}

// --- AES-128-ECB decrypt (crypto-js, works in browser) ---

function aesDecrypt(base64Str: string, keyStr: string): string {
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const decrypted = CryptoJS.AES.decrypt(base64Str, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

export function decryptData(encryptedBase64: string): { vroList: ExternalProduct[]; totalVisitors: number; raw: ExternalData } {
  const raw = aesDecrypt(encryptedBase64, ENCRYPT_KEY)
  const parsed: ExternalData = JSON.parse(raw)

  if (!parsed.success || !parsed.data?.vroList?.length) {
    throw new Error('数据格式异常：success 不为 true 或 vroList 为空')
  }

  const totalVisitors = parsed.data.vroList.reduce((sum, item) => sum + (item.productVisitorNum || 0), 0)
  return { vroList: parsed.data.vroList, totalVisitors, raw: parsed }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    // 使用全局导航回调而不是 window.location.href
    if (navigateToLogin) {
      navigateToLogin()
    } else {
      // fallback 到 window.location（在开发环境可能不可靠）
      window.location.href = '/login'
    }
    throw new Error('登录已过期')
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data as T
}

export const api = {
  // Auth
  checkSetup: () => request<{ hasAdmin: boolean }>('/auth/check'),
  setup: (username: string, password: string) =>
    request<{ message: string }>('/auth/setup', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Shops
  getShops: () => request<Shop[]>('/shops'),
  createShop: (name: string, platform: string) =>
    request<Shop>('/shops', { method: 'POST', body: JSON.stringify({ name, platform }) }),
  updateShop: (id: string, name: string, platform: string) =>
    request<{ message: string }>(`/shops/${id}`, { method: 'PUT', body: JSON.stringify({ name, platform }) }),
  deleteShop: (id: string) =>
    request<{ message: string }>(`/shops/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (shopId?: string, page?: number, pageSize?: number, date?: string, search?: string, sortBy?: string, sortOrder?: string, labelId?: string, noLabel?: boolean) =>
    request<{ items: Product[]; total: number; page: number; page_size: number }>(`/products?${shopId ? `shop_id=${shopId}&` : ''}page=${page || 1}&page_size=${pageSize || 30}${date ? `&date=${date}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${sortBy ? `&sort_by=${sortBy}` : ''}${sortOrder ? `&sort_order=${sortOrder}` : ''}${labelId ? `&label_id=${labelId}` : ''}${noLabel ? `&no_label=1` : ''}`),
  createProduct: (data: { shop_id: string; name: string; image_url?: string; description?: string; sku?: string; price?: string }) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: { name: string; image_url?: string; description?: string; sku?: string; price?: string }) =>
    request<{ message: string }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),
  refreshProducts: (productIds: string[]) =>
    request<{ success: boolean; count: number; refreshed_at: string }>('/products/refresh', { method: 'POST', body: JSON.stringify({ product_ids: productIds }) }),

  // Stats
  getDashboard: (shopId?: string) =>
    request<DashboardData>(`/stats/dashboard${shopId ? `?shop_id=${shopId}` : ''}`),
  getTrend: (start: string, end: string, shopId?: string) =>
    request<any>(`/stats/trend?start=${start}&end=${end}${shopId ? `&shop_id=${shopId}` : ''}`),
  getTopProducts: (start: string, end: string, shopId?: string) =>
    request<any>(`/stats/top-products?start=${start}&end=${end}${shopId ? `&shop_id=${shopId}` : ''}`),
  getProductRanking: (days?: number, shopId?: string, page?: number, limit?: number, search?: string) =>
    request<{ items: any[]; total: number; page: number; limit: number }>(`/stats/product-ranking?days=${days || 7}${shopId ? `&shop_id=${shopId}` : ''}&page=${page || 1}&limit=${limit || 20}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  importData: (data: ExternalData, shopId: string, date: string) =>
    request<{ message: string; imported_products: number; total_visitors: number }>('/stats/import', { method: 'POST', body: JSON.stringify({ data, shop_id: shopId, date }) }),
  getProductStats: (productId: string, start?: string, end?: string) =>
    request<{ product: Product; stats: { date: string; view_count: number; viewer_count: number; tx_count: number }[] }>(`/stats/product/${productId}${start || end ? `?start=${start || ''}&end=${end || ''}` : ''}`),

  // Visitors
  getProductVisitors: (productId: string, date?: string) =>
    request<(Visitor & { date: string })[]>(`/stats/product/${productId}/visitors${date ? `?date=${date}` : ''}`),
  getVisitors: (page?: number, limit?: number, search?: string, date?: string) =>
    request<{ visitors: (Visitor & { visit_count: number })[]; total: number; page: number; limit: number }>(`/stats/visitors?page=${page || 1}&limit=${limit || 30}${search ? `&search=${search}` : ''}${date ? `&date=${date}` : ''}`),
  getVisitorProducts: (visitorId: string) =>
    request<{ id: string; name: string; image_url: string; sku: string; price: string; description: string; date: string; visit_count: number }[]>(`/stats/visitors/${visitorId}/products`),

  // Transactions
  createTransaction: (data: { product_id: string; shop_id: string; price: string; quantity?: number; date: string; note?: string }) =>
    request<any>('/stats/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getTransactions: (params?: { shop_id?: string; product_id?: string; start?: string; end?: string; page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.shop_id) q.set('shop_id', params.shop_id)
    if (params?.product_id) q.set('product_id', params.product_id)
    if (params?.start) q.set('start', params.start)
    if (params?.end) q.set('end', params.end)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.search) q.set('search', params.search)
    return request<{ items: any[]; total: number; page: number; limit: number }>(`/stats/transactions?${q.toString()}`)
  },
  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/stats/transactions/${id}`, { method: 'DELETE' }),
  getTransactionTrend: (start: string, end: string, shopId?: string) =>
    request<{ date: string; tx_count: number; tx_amount: number }[]>(`/stats/transactions/trend?start=${start}&end=${end}${shopId ? `&shop_id=${shopId}` : ''}`),
  getDashboardRefunds: (shopId?: string) =>
    request<{ todayRefundCount: number; todayRefundAmount: number; yesterdayRefundCount: number; yesterdayRefundAmount: number }>(`/stats/dashboard-refunds${shopId ? `?shop_id=${shopId}` : ''}`),

  // Refunds
  createRefund: (data: { transaction_id: string; price: string; quantity?: number; date: string; note?: string }) =>
    request<any>('/stats/refunds', { method: 'POST', body: JSON.stringify(data) }),
  getRefunds: (params?: { start?: string; end?: string; shop_id?: string }) => {
    const q = new URLSearchParams()
    if (params?.start) q.set('start', params.start)
    if (params?.end) q.set('end', params.end)
    if (params?.shop_id) q.set('shop_id', params.shop_id)
    return request<any[]>(`/stats/refunds?${q.toString()}`)
  },
  deleteRefund: (id: string) =>
    request<{ message: string }>(`/stats/refunds/${id}`, { method: 'DELETE' }),

  // Labels
  getLabels: () =>
    request<ProductLabel[]>('/labels'),
  importLabels: () =>
    request<{ message: string; imported: number }>('/labels/import', { method: 'POST' }),
  syncProductLabels: (batchSize?: number) =>
    request<{ synced: number; total: number; remaining: number }>(`/labels/sync-products${batchSize ? `?batch_size=${batchSize}` : ''}`, { method: 'POST' }),
  getProductLabels: (productId: string) =>
    request<{ label_id: string; label_name: string }[]>(`/labels/product/${productId}`),
  setProductLabels: (productId: string, labelIds: string[]) =>
    request<{ message: string }>(`/labels/product/${productId}`, { method: 'PUT', body: JSON.stringify({ label_ids: labelIds }) }),
}
