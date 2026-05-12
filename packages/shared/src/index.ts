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

/**
 * 外部访客数据（queryProductVisitorList API 返回的单个访客）
 * 主要字段:
 *   id         → 外部系统访客唯一 ID
 *   nickName   → 昵称
 *   iconUrl    → 头像 URL
 *   cityName   → 城市
 *   description → 个人描述
 */
export interface ExternalVisitor {
  id: string
  nickName: string | null
  iconUrl: string | null
  cityName: string | null
  description: string | null
  mobilePhone: string | null
  [key: string]: unknown
}

/**
 * 访客主表（对应 visitors 表，独立存在，不随商品删除）
 *
 * 字段映射（ExternalVisitor → Visitor）:
 *   id                       → ext_visitor_id  （外部访客 ID）
 *   nickName                 → nick_name        （昵称）
 *   iconUrl                  → icon_url         （头像）
 *   cityName                 → city_name        （城市）
 *   description              → description      （个人描述）
 */
export interface Visitor {
  id: string
  ext_visitor_id: string
  nick_name: string
  icon_url: string
  city_name: string
  description: string
  first_seen_at: string
  updated_at: string
}

/** 商品-访客关联记录（对应 product_visitor_relations 表，某访客某天访问了某商品） */
export interface ProductVisitorRelation {
  id: string
  product_id: string
  visitor_id: string
  date: string
  created_at: string
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
