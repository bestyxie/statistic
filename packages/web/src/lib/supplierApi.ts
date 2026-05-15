import type { Supplier, SupplierProduct, PurchaseRecord } from '@statistic/shared'
import { request } from './api'

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

  // 供货商品
  getSupplierProducts: (supplierId: string) =>
    request<SupplierProduct[]>(`/suppliers/${supplierId}/products`),
  createSupplierProduct: (supplierId: string, data: { product_code?: string; price?: string; image_url?: string; description?: string }) =>
    request<SupplierProduct>(`/suppliers/${supplierId}/products`, { method: 'POST', body: JSON.stringify(data) }),
  updateSupplierProduct: (supplierId: string, productId: string, data: { product_code?: string; price?: string; image_url?: string; description?: string }) =>
    request<{ message: string }>(`/suppliers/${supplierId}/products/${productId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplierProduct: (supplierId: string, productId: string) =>
    request<{ message: string }>(`/suppliers/${supplierId}/products/${productId}`, { method: 'DELETE' }),

  // 拿货记录
  getPurchaseRecords: (supplierId: string) =>
    request<(PurchaseRecord & { product_code: string; description: string; image_url: string })[]>(`/suppliers/${supplierId}/purchases`),
  createPurchaseRecord: (supplierId: string, data: { supplier_product_id: string; price: string; quantity?: number; purchase_date: string; note?: string }) =>
    request<PurchaseRecord>(`/suppliers/${supplierId}/purchases`, { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseRecord: (supplierId: string, purchaseId: string, data: { price: string; quantity?: number; purchase_date: string; note?: string }) =>
    request<{ message: string }>(`/suppliers/${supplierId}/purchases/${purchaseId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchaseRecord: (supplierId: string, purchaseId: string) =>
    request<{ message: string }>(`/suppliers/${supplierId}/purchases/${purchaseId}`, { method: 'DELETE' }),
}
