import CryptoJS from 'crypto-js'
import type { Shop, Product, DashboardData, ExternalProduct, ExternalData, Visitor } from '@statistic/shared'

const API_BASE = '/api'
const ENCRYPT_KEY = 'wxtdefgabcdawn12'

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
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
  getProducts: (shopId?: string, page?: number, pageSize?: number) =>
    request<{ items: Product[]; total: number; page: number; page_size: number }>(`/products${shopId ? `?shop_id=${shopId}&` : '?'}page=${page || 1}&page_size=${pageSize || 30}`),
  createProduct: (data: { shop_id: string; name: string; image_url?: string; sku?: string; price?: string }) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: { name: string; image_url?: string; description?: string; sku?: string; price?: string }) =>
    request<{ message: string }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),

  // Stats
  getDashboard: (shopId?: string) =>
    request<DashboardData>(`/stats/dashboard${shopId ? `?shop_id=${shopId}` : ''}`),
  getTrend: (start: string, end: string, shopId?: string) =>
    request<any>(`/stats/trend?start=${start}&end=${end}${shopId ? `&shop_id=${shopId}` : ''}`),
  getTopProducts: (start: string, end: string, shopId?: string) =>
    request<any>(`/stats/top-products?start=${start}&end=${end}${shopId ? `&shop_id=${shopId}` : ''}`),
  importData: (data: ExternalData, shopId: string, date: string) =>
    request<{ message: string; imported_products: number; total_visitors: number }>('/stats/import', { method: 'POST', body: JSON.stringify({ data, shop_id: shopId, date }) }),
  getProductStats: (productId: string, start?: string, end?: string) =>
    request<{ product: Product; stats: { date: string; view_count: number; viewer_count: number }[] }>(`/stats/product/${productId}${start || end ? `?start=${start || ''}&end=${end || ''}` : ''}`),

  // Visitors
  getProductVisitors: (productId: string, date?: string) =>
    request<(Visitor & { date: string })[]>(`/stats/product/${productId}/visitors${date ? `?date=${date}` : ''}`),
  getVisitors: (page?: number, limit?: number, search?: string) =>
    request<{ visitors: (Visitor & { visit_count: number })[]; total: number; page: number; limit: number }>(`/stats/visitors?page=${page || 1}&limit=${limit || 30}${search ? `&search=${search}` : ''}`),
}
