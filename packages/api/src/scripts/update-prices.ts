#!/usr/bin/env npx tsx
/**
 * 更新数据库中现有商品的价格
 * 从商品描述中自动提取价格并更新
 * 用法: npx tsx src/scripts/update-prices.ts
 */
import { LocalD1 } from '../local-db'
import { extractPrice } from '../utils/price'

async function main() {
  console.log('\n=== 更新商品价格 ===\n')

  const db = new LocalD1()
  await db.init()

  // 1. 查询所有商品
  console.log('正在查询商品...')
  const result = await db.prepare('SELECT id, name, description, price FROM products').all<{ id: string; name: string; description: string; price: string }>()

  const products = result.results
  console.log(`  找到 ${products.length} 个商品\n`)

  // 2. 筛选出需要更新的商品
  const toUpdate: Array<{ id: string; name: string; oldPrice: string; newPrice: string }> = []

  for (const product of products) {
    // 如果已有价格，跳过
    if (product.price && product.price.trim() !== '') {
      continue
    }

    // 从描述中提取价格
    const newPrice = extractPrice(product.description || '')
    if (newPrice) {
      toUpdate.push({
        id: product.id,
        name: product.name,
        oldPrice: product.price,
        newPrice,
      })
    }
  }

  if (toUpdate.length === 0) {
    console.log('没有需要更新的商品')
    db.save()
    process.exit(0)
  }

  console.log(`找到 ${toUpdate.length} 个需要更新价格的商品:\n`)

  // 3. 显示预览
  for (const item of toUpdate.slice(0, 10)) {
    console.log(`  [${item.name}]`)
    console.log(`    旧价格: "${item.oldPrice || '(空)'}"`)
    console.log(`    新价格: "${item.newPrice}"`)
  }

  if (toUpdate.length > 10) {
    console.log(`  ... 还有 ${toUpdate.length - 10} 个商品\n`)
  }

  // 4. 执行更新
  console.log('\n正在更新...')
  let updated = 0

  for (const item of toUpdate) {
    await db.prepare('UPDATE products SET price = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(item.newPrice, item.id)
      .run()
    updated++
  }

  db.save()

  // 等待文件系统写入完成
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log(`\n完成! 更新了 ${updated} 个商品的价格`)
}

main().catch((e) => {
  console.error('执行失败:', e.message)
  process.exit(1)
})
