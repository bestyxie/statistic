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
  visit_count: number
  created_at: string
}

/** 成交记录（对应 transactions 表） */
export interface Transaction {
  id: string
  product_id: string
  shop_id: string
  price: string
  quantity: number
  date: string
  note: string
  created_at: string
}

/** 退款记录（关联成交记录） */
export interface Refund {
  id: string
  transaction_id: string
  price: string
  quantity: number
  date: string
  note: string
  created_at: string
}

/**
 * 外部访客列表数据（queryCustomerViewByConditionV2 返回的单个访客）
 * 主要字段:
 *   uid                → ext_visitor_id  （外部访客 ID）
 *   nick_name          → nick_name        （昵称）
 *   iconUrl            → icon_url         （头像）
 *   productVisitorNum  → 该访客浏览商品总次数
 */
export interface ExternalCustomerVisitor {
  uid: string
  nick_name: string | null
  iconUrl: string | null
  productVisitorNum: number | null
  [key: string]: unknown
}

/**
 * 外部访客浏览商品记录（queryVisitorRecordByUidV2 返回的单条记录）
 * 同一商品出现多次代表该访客多次访问
 * 主要字段:
 *   code        → 商品 SKU
 *   description → 商品描述
 *   picUrl      → 商品图片
 *   pid         → 商品外部 ID
 *   visitorTime → 访问时间戳
 */
export interface ExternalVisitorRecord {
  id: string | null
  code: string
  description: string | null
  picUrl: string | null
  pid: string | null
  visitorValue: string | null
  visitorAction: number | null
  visitorTime: number | null
  pictureCount: number | null
  mediaType: string | null
  [key: string]: unknown
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
