#!/usr/bin/env npx tsx
/**
 * 自动抓取昨天商品访客数据并录入到统计系统
 * 用法: npx tsx src/scripts/import-yesterday.ts
 */
import { queryBestSelling } from './query-best-selling'

const API_BASE = 'http://localhost:3001/api'
const SHOP_ID = '47f4f287-a4cb-453d-aa44-3ea3ec2dcc03'

// 昨天的日期 YYYY-MM-DD
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

async function main() {
  console.log(`\n=== 自动导入商品数据 ===`)
  console.log(`日期: ${yesterday}`)
  console.log(`店铺: ${SHOP_ID}\n`)

  // 1. 抓取数据
  console.log('正在从 gxhy1688.com 抓取数据...')

  const result = await queryBestSelling({ pageIndex: 10, pageSize: 30 })
  const allItems: any[] = result?.data?.vroList ?? []

  if (allItems.length === 0) {
    console.log('没有抓取到数据，可能 cookie 已过期或接口不可用')
    process.exit(1)
  }

  console.log(`  获取到 ${allItems.length} 个商品\n`)

  // 2. 构造数据
  const payload = {
    encrypt: false,
    code: null,
    msg: null,
    data: { vroList: allItems },
    success: true,
  }

  // 3. 登录获取 token
  console.log('正在登录...')
  const username = process.env.ADMIN_USER || 'admin'
  const password = process.env.ADMIN_PASS || 'admin123'

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const loginData = await loginRes.json()

  if (!loginData.token) {
    console.log('登录失败:', loginData.error)
    console.log('请确认管理员账号已创建，或设置环境变量 ADMIN_USER 和 ADMIN_PASS')
    process.exit(1)
  }

  const token = loginData.token
  console.log('登录成功\n')

  // 4. 导入数据
  console.log('正在导入数据...')
  const importRes = await fetch(`${API_BASE}/stats/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: payload,
      shop_id: SHOP_ID,
      date: yesterday,
    }),
  })
  const importData = await importRes.json()

  if (importRes.ok || importData.message) {
    console.log(`\n导入成功!`)
    console.log(`  商品数: ${importData.imported_products}`)
    console.log(`  总访客: ${importData.total_visitors}`)
  } else {
    console.log(`\n导入失败: ${importData.error}`)
  }
}

main().catch((e) => {
  console.error('执行失败:', e.message)
  process.exit(1)
})
