import type { Supplier, ProductSupplier, PurchaseRecord } from '@statistic/shared'
import { request } from './api'

export type ProductSupplierWithInfo = ProductSupplier & {
  product_name: string
  product_image: string
  product_description: string
  product_sku: string
  product_price: string
  supplier_name: string
}

export type PurchaseWithProduct = PurchaseRecord & {
  product_name: string
  product_image: string
  product_description: string
  product_sku: string
}

export const supplierApi = {
  // 供应商
  getSuppliers: () =>
    request<Supplier[]>('/suppliers'),
  createSupplier: (data: { wechat_nickname: string; wechat_id?: string; remark?: string }) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: { wechat_nickname: string; wechat_id?: string; remark?: string }) =>
    request<{ message: string }>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) =>
    request<{ message: string }>(`/suppliers/${id}`, { method: 'DELETE' }),

  // 全量关联（搜索）
  getAllProducts: (params?: { search?: string; supplier_id?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.supplier_id) q.set('supplier_id', params.supplier_id)
    return request<ProductSupplierWithInfo[]>(`/suppliers/all-products?${q.toString()}`)
  },

  // 商品-供应商关联
  linkProduct: (data: { product_id: string; supplier_id: string; price?: string; note?: string }) =>
    request<ProductSupplier>('/suppliers/link', { method: 'POST', body: JSON.stringify(data) }),
  updateLink: (id: string, data: { price?: string; note?: string; supplier_id?: string }) =>
    request<{ message: string }>(`/suppliers/link/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  unlinkProduct: (id: string) =>
    request<{ message: string }>(`/suppliers/link/${id}`, { method: 'DELETE' }),

  // 获取某供应商的关联商品（用于拿货记录下拉）
  getSupplierProducts: (supplierId: string) =>
    request<ProductSupplierWithInfo[]>(`/suppliers/all-products?supplier_id=${supplierId}`),

  // 拿货记录
  getPurchaseRecords: (supplierId: string) =>
    request<PurchaseWithProduct[]>(`/suppliers/${supplierId}/purchases`),
  createPurchaseRecord: (supplierId: string, data: { product_supplier_id: string; price: string; quantity?: number; purchase_date: string; note?: string }) =>
    request<PurchaseRecord>(`/suppliers/${supplierId}/purchases`, { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseRecord: (supplierId: string, purchaseId: string, data: { price: string; quantity?: number; purchase_date: string; note?: string }) =>
    request<{ message: string }>(`/suppliers/${supplierId}/purchases/${purchaseId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchaseRecord: (supplierId: string, purchaseId: string) =>
    request<{ message: string }>(`/suppliers/${supplierId}/purchases/${purchaseId}`, { method: 'DELETE' }),

  // cURL 解析
  parseCurl: (curl: string) =>
    request<{ success: boolean; data?: { image_url: string; description: string; price: string; product_code: string }; error?: string; raw?: unknown }>('/suppliers/parse-curl', { method: 'POST', body: JSON.stringify({ curl }) }),
}
