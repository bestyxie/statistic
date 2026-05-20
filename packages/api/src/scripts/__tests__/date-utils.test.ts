#!/usr/bin/env npx tsx
/**
 * 测试 getBeijingYesterday 在不同 UTC 时间下返回正确的北京时间日期
 */

import { getBeijingYesterday, getBeijingToday } from '../date-utils'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`)
    passed++
  } else {
    console.log(`  ❌ ${message}`)
    failed++
  }
}

// 测试1: 模拟北京时间凌晨1点运行 (UTC 17:00 = 前一天)
// 这是定时任务实际运行的时间
console.log('\n测试1: 北京时间凌晨1点 (UTC 前一天 17:00)')
{
  // 2026-05-20 01:00 北京时间 = 2026-05-19 17:00 UTC
  const utcTime = new Date('2026-05-19T17:00:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  const yesterday = getBeijingYesterday()
  assert(yesterday === '2026-05-19', `期望 2026-05-19, 得到 ${yesterday}`)

  Date.now = originalNow
}

// 测试2: 模拟北京时间上午9点运行 (UTC 01:00 = 同一天)
console.log('\n测试2: 北京时间上午9点 (UTC 同一天 01:00)')
{
  // 2026-05-20 09:00 北京时间 = 2026-05-20 01:00 UTC
  const utcTime = new Date('2026-05-20T01:00:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  const yesterday = getBeijingYesterday()
  assert(yesterday === '2026-05-19', `期望 2026-05-19, 得到 ${yesterday}`)

  Date.now = originalNow
}

// 测试3: 模拟北京时间晚上11点运行 (UTC 15:00 = 同一天)
console.log('\n测试3: 北京时间晚上11点 (UTC 同一天 15:00)')
{
  // 2026-05-20 23:00 北京时间 = 2026-05-20 15:00 UTC
  const utcTime = new Date('2026-05-20T15:00:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  const yesterday = getBeijingYesterday()
  assert(yesterday === '2026-05-19', `期望 2026-05-19, 得到 ${yesterday}`)

  Date.now = originalNow
}

// 测试4: 模拟北京时间凌晨0点30分 (UTC 前一天 16:30)
// 这是最容易出错的边界时间
console.log('\n测试4: 北京时间凌晨0点30分 (UTC 前一天 16:30)')
{
  // 2026-05-20 00:30 北京时间 = 2026-05-19 16:30 UTC
  const utcTime = new Date('2026-05-19T16:30:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  const yesterday = getBeijingYesterday()
  assert(yesterday === '2026-05-19', `期望 2026-05-19, 得到 ${yesterday}`)

  Date.now = originalNow
}

// 测试5: 跨年测试 - 北京时间1月1日凌晨1点
console.log('\n测试5: 跨年测试 - 北京时间1月1日凌晨1点')
{
  // 2026-01-01 01:00 北京时间 = 2025-12-31 17:00 UTC
  const utcTime = new Date('2025-12-31T17:00:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  const yesterday = getBeijingYesterday()
  assert(yesterday === '2025-12-31', `期望 2025-12-31, 得到 ${yesterday}`)

  Date.now = originalNow
}

// 测试6: 对比旧方法和新方法在凌晨1点的差异
console.log('\n测试6: 对比旧方法 vs 新方法 (北京时间凌晨1点)')
{
  const utcTime = new Date('2026-05-19T17:00:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  // 旧方法 (有 bug)
  const oldResult = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  // 新方法
  const newResult = getBeijingYesterday()

  console.log(`  旧方法结果: ${oldResult}`)
  console.log(`  新方法结果: ${newResult}`)
  assert(oldResult !== newResult, `旧方法 (${oldResult}) 应该和新方法 (${newResult}) 不同`)
  assert(newResult === '2026-05-19', `新方法应返回 2026-05-19`)

  Date.now = originalNow
}

// 测试7: getBeijingToday
console.log('\n测试7: getBeijingToday 在 UTC 跨天时返回正确的北京日期')
{
  // 2026-05-20 01:00 北京时间 = 2026-05-19 17:00 UTC
  const utcTime = new Date('2026-05-19T17:00:00Z').getTime()
  const originalNow = Date.now
  Date.now = () => utcTime

  const today = getBeijingToday()
  assert(today === '2026-05-20', `期望 2026-05-20, 得到 ${today}`)

  Date.now = originalNow
}

// 汇总
console.log(`\n${'='.repeat(40)}`)
if (failed === 0) {
  console.log(`全部 ${passed} 个测试通过 ✅`)
} else {
  console.log(`${passed} 个通过, ${failed} 个失败 ❌`)
  process.exit(1)
}
