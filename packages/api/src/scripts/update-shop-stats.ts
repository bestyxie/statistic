#!/usr/bin/env npx tsx
import { queryCustomerViewByCondition } from './query-best-selling'

const API_BASE = 'http://localhost:3001/api'
const SHOP_ID = 'eee675ce-2a83-4413-96b2-155c2c0385a4'

async function main() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const r = await queryCustomerViewByCondition({ pageIndex: 10, searchDay: 1, pageSize: 30 })
  const storeVisitorNum = r?.data?.vroVO?.storeVisitorNum ?? r?.data?.vroList?.length ?? 0
  console.log(`昨日 (${yesterday}) 店铺总访客: ${storeVisitorNum}`)

  // 登录
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin123' }),
  })
  const { token } = await loginRes.json()

  const res = await fetch(`${API_BASE}/stats/import-shop-stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ shop_id: SHOP_ID, date: yesterday, visitor_count: storeVisitorNum }),
  })
  console.log(await res.json())
}

main()
