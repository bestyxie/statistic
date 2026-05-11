export interface Shop {
  id: string
  name: string
  platform: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  shop_id: string
  shop_name?: string
  name: string
  image_url: string
  description: string
  sku: string
  price: string
  created_at: string
  updated_at: string
}

export interface DailyShopStats {
  id: string
  shop_id: string
  date: string
  visitor_count: number
  created_at: string
}

export interface DailyProductStats {
  id: string
  product_id: string
  shop_id: string
  date: string
  view_count: number
  viewer_count: number
  created_at: string
}

export interface DashboardData {
  today: number
  yesterday: number
  trend: { date: string; visitors: number }[]
  topProducts: TopProduct[]
}

export interface TopProduct {
  name: string
  image_url: string
  sku?: string
  price?: string
  total_views: number
  total_viewers: number
}

/** 外部数据源格式（vroList） */
export interface ExternalData {
  encrypt: boolean
  code: string | null
  msg: string | null
  data: {
    vroList: ExternalProduct[]
  }
  success: boolean
}

export interface ExternalProduct {
  id: string
  code: string
  description: string
  productVisitorNum: number
  pid: string
  picturePath: string
  pictureCount: number
  picUrl: string
}

/** API 通用响应 */
export interface ApiResponse<T = unknown> {
  message?: string
  error?: string
  data?: T
}
