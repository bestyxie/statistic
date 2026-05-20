#!/usr/bin/env npx tsx
/**
 * 通过"访客列表 → 浏览商品列表"录入昨日数据
 * 流程:
 *   1. 获取昨日店铺所有访客
 *   2. 对每个访客，获取其浏览的商品列表
 *   3. 统计每个商品被该访客访问的次数
 *   4. 导入: 商品入库 + 更新访客关联(visit_count)
 *   5. 所有访客处理完后，更新每个商品的 daily_product_stats
 *      - view_count = 该商品当日所有访客的 visit_count 之和
 *      - viewer_count = 该商品当日的访客数
 *
 * 用法: npx tsx src/scripts/import-by-visitors.ts
 */
import {
  queryCustomerViewByCondition,
  queryVisitorRecordByUid,
} from './query-best-selling'
import { getBeijingYesterday } from './date-utils'

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api'
const SHOP_ID = process.env.SHOP_ID || 'eee675ce-2a83-4413-96b2-155c2c0385a4'

interface VisitorItem {
  uid: string
  nick_name: string | null
  iconUrl: string | null
  productVisitorNum: number | null
}

interface ProductRecord {
  code: string
  description: string | null
  picUrl: string | null
  pid: string | null
  visitorTime: number | null
}

export async function importByVisitors(shopId?: string) {
  const yesterday = getBeijingYesterday()
  const effectiveShopId = shopId || process.env.SHOP_ID || SHOP_ID

  console.log(`\n=== 通过访客列表导入数据 ===`)
  console.log(`日期: ${yesterday}`)
  console.log(`店铺: ${effectiveShopId}\n`)

  // 1. 登录
  console.log('正在登录...')
  const username = process.env.ADMIN_USER || 'admin'
  const password = process.env.ADMIN_PASS || 'admin123'

  console.log(`API_BASE: ${API_BASE}`)

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const loginData = await loginRes.json()

  if (!loginData.token) {
    console.log('登录失败:', loginData.error)
    process.exit(1)
  }

  const token = loginData.token
  console.log('登录成功\n')

  // 2. 获取所有访客（pageIndex=10 累积返回前11页数据）
  console.log('正在获取访客列表...')
  const result = await queryCustomerViewByCondition({
    pageIndex: 10,
    searchDay: 1,
    pageSize: 30,
  })

  const allVisitors: VisitorItem[] = result?.data?.vroList ?? []
  const storeVisitorNum: number = result?.data?.vroVO?.storeVisitorNum ?? 0

  console.log(`\n共获取 ${allVisitors.length} 个访客（店铺总访客: ${storeVisitorNum}）\n`)

  if (allVisitors.length === 0) {
    console.log('没有访客数据，可能 cookie 已过期')
    process.exit(0)
  }

  // 收集所有涉及的 product code，用于最后更新 daily_product_stats
  const affectedProducts = new Set<string>()

  // 3. 遍历每个访客
  let totalRelations = 0

  for (let i = 0; i < allVisitors.length; i++) {
    const visitor = allVisitors[i]
    const uid = visitor.uid

    if (!uid) continue

    process.stdout.write(`\r  [${i + 1}/${allVisitors.length}] 正在处理访客 ${visitor.nick_name || uid.slice(0, 8)}...`)

    try {
      const recordResult = await queryVisitorRecordByUid({
        visitorUid: uid,
        searchDay: 1,
      })

      const records: ProductRecord[] = recordResult?.data?.vroList ?? []

      if (records.length === 0) continue

      // 按 code 统计每个商品被该访客访问的次数
      const productVisitMap = new Map<string, { count: number; record: ProductRecord }>()
      for (const r of records) {
        if (!r.code) continue
        const existing = productVisitMap.get(r.code)
        if (existing) {
          existing.count++
        } else {
          productVisitMap.set(r.code, { count: 1, record: r })
        }
      }

      const productVisits = Array.from(productVisitMap.entries()).map(([code, { count, record }]) => ({
        code,
        description: record.description,
        picUrl: record.picUrl,
        pid: record.pid,
        visit_count: count,
      }))

      // 记录涉及的 product code
      productVisits.forEach((pv) => affectedProducts.add(pv.code))

      // 调用导入接口
      const importRes = await fetch(`${API_BASE}/stats/import-by-visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_id: effectiveShopId,
          date: yesterday,
          visitor: {
            uid,
            nick_name: visitor.nick_name,
            iconUrl: visitor.iconUrl,
          },
          product_visits: productVisits,
        }),
      })

      const importData = await importRes.json()

      if (importData.message) {
        totalRelations += productVisits.length
      } else {
        console.log(`\n  访客 ${uid} 导入失败: ${importData.error}`)
      }
    } catch (e: any) {
      console.log(`\n  访客 ${uid} 处理失败: ${e.message}`)
    }
  }

  // 4. 更新店铺日统计
  console.log(`\n\n正在更新店铺统计...`)
  await fetch(`${API_BASE}/stats/import-shop-stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shop_id: effectiveShopId,
      date: yesterday,
      visitor_count: storeVisitorNum || allVisitors.length,
    }),
  })

  // 5. 更新涉及商品的 daily_product_stats
  console.log(`正在更新商品统计...`)
  const productCodes = Array.from(affectedProducts)

  for (const code of productCodes) {
    try {
      await fetch(`${API_BASE}/stats/recalculate-product-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_id: effectiveShopId,
          product_sku: code,
          date: yesterday,
        }),
      })
    } catch {
      // ignore
    }
  }

  console.log(`\n导入完成!`)
  console.log(`  处理访客: ${allVisitors.length}`)
  console.log(`  涉及商品: ${productCodes.length}`)
  console.log(`  关联记录: ${totalRelations}`)
}

// 直接运行脚本（支持手动导入）
async function main() {
  try {
    await importByVisitors()
  } catch (error: any) {
    console.error('执行失败:', error.message)
    process.exit(1)
  }
}

// 允许直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error('执行失败:', e.message)
    process.exit(1)
  })
}
