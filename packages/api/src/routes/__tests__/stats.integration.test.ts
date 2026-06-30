import { beforeEach, describe, expect, it } from 'vitest'
import statsRoutes from '../stats'
import { createInMemoryD1, type LocalD1 } from '../../local-db'
import type { LabelProductStat, LabelSalesItem, LabelTrendItem, LabelTxTrendItem } from '@statistic/shared'

async function seedFixture(db: LocalD1): Promise<void> {
  await db.prepare("INSERT INTO shops (id, name) VALUES (?, ?)").bind('shop-1', 'Shop 1').run()
  await db.prepare("INSERT INTO shops (id, name) VALUES (?, ?)").bind('shop-2', 'Shop 2').run()

  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-A', 'shop-1', 'A', 'A').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-B', 'shop-1', 'B', 'B').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-C', 'shop-2', 'C', 'C').run()

  await db.prepare("INSERT INTO product_labels (label_id, label_name, sort) VALUES (?, ?, ?)").bind('label-1', 'Brand One', 10).run()
  await db.prepare("INSERT INTO product_labels (label_id, label_name, sort) VALUES (?, ?, ?)").bind('label-2', 'Brand Two', 20).run()

  await db.prepare("INSERT INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)").bind('plr-A1', 'p-A', 'label-1').run()
  await db.prepare("INSERT INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)").bind('plr-B1', 'p-B', 'label-1').run()
  await db.prepare("INSERT INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)").bind('plr-C2', 'p-C', 'label-2').run()

  await db.prepare("INSERT INTO visitors (id, ext_visitor_id, nick_name) VALUES (?, ?, ?)").bind('v-1', 'ext-1', 'Alice').run()
  await db.prepare("INSERT INTO visitors (id, ext_visitor_id, nick_name) VALUES (?, ?, ?)").bind('v-2', 'ext-2', 'Bob').run()
  await db.prepare("INSERT INTO visitors (id, ext_visitor_id, nick_name) VALUES (?, ?, ?)").bind('v-3', 'ext-3', 'Carol').run()

  // 2026-06-10: label-1 (p-A + p-B) - v-1 visits both → counts as 1 distinct visitor
  await db.prepare("INSERT INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count) VALUES (?, ?, ?, ?, ?)").bind('r-1', 'p-A', 'v-1', '2026-06-10', 3).run()
  await db.prepare("INSERT INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count) VALUES (?, ?, ?, ?, ?)").bind('r-2', 'p-B', 'v-1', '2026-06-10', 2).run()
  await db.prepare("INSERT INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count) VALUES (?, ?, ?, ?, ?)").bind('r-3', 'p-A', 'v-2', '2026-06-10', 1).run()
  // 2026-06-11: label-1 only p-A, v-3
  await db.prepare("INSERT INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count) VALUES (?, ?, ?, ?, ?)").bind('r-4', 'p-A', 'v-3', '2026-06-11', 4).run()
  // 2026-06-10: label-2 (p-C) - v-2
  await db.prepare("INSERT INTO product_visitor_relations (id, product_id, visitor_id, date, visit_count) VALUES (?, ?, ?, ?, ?)").bind('r-5', 'p-C', 'v-2', '2026-06-10', 2).run()

  // Transactions
  await db.prepare("INSERT INTO transactions (id, product_id, shop_id, price, quantity, date) VALUES (?, ?, ?, ?, ?, ?)").bind('t-1', 'p-A', 'shop-1', '10.00', 2, '2026-06-10').run()
  await db.prepare("INSERT INTO transactions (id, product_id, shop_id, price, quantity, date) VALUES (?, ?, ?, ?, ?, ?)").bind('t-2', 'p-C', 'shop-2', '5.00', 1, '2026-06-10').run()
  await db.prepare("INSERT INTO transactions (id, product_id, shop_id, price, quantity, date) VALUES (?, ?, ?, ?, ?, ?)").bind('t-3', 'p-A', 'shop-1', '10.00', 1, '2026-06-12').run()
}

async function fetchLabelTrend(
  db: LocalD1,
  query: string,
): Promise<{ status: number; items: LabelTrendItem[] }> {
  const res = await statsRoutes.fetch(
    new Request(`http://localhost/label-trend?${query}`),
    { DB: db },
  )
  const body = await res.json() as { items?: LabelTrendItem[] }
  return { status: res.status, items: body.items ?? [] }
}

async function fetchLabelTxTrend(
  db: LocalD1,
  query: string,
): Promise<{ status: number; items: LabelTxTrendItem[] }> {
  const res = await statsRoutes.fetch(
    new Request(`http://localhost/label-tx-trend?${query}`),
    { DB: db },
  )
  const body = await res.json() as { items?: LabelTxTrendItem[] }
  return { status: res.status, items: body.items ?? [] }
}

describe('GET /stats/label-trend', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('returns empty items when label_ids is missing', async () => {
    const { status, items } = await fetchLabelTrend(db, 'start=2026-06-10&end=2026-06-11')
    expect(status).toBe(200)
    expect(items).toEqual([])
  })

  it('returns empty items when start or end is missing', async () => {
    const { status, items } = await fetchLabelTrend(db, 'label_ids=label-1')
    expect(status).toBe(200)
    expect(items).toEqual([])
  })

  it('counts DISTINCT visitors across multiple products in the same label', async () => {
    // 2026-06-10: label-1 has v-1 (on both p-A and p-B) + v-2 (on p-A) = 2 distinct
    const { status, items } = await fetchLabelTrend(db, 'label_ids=label-1&start=2026-06-10&end=2026-06-10')
    expect(status).toBe(200)
    expect(items).toHaveLength(1)
    expect(items[0].label_id).toBe('label-1')
    expect(items[0].label_name).toBe('Brand One')
    expect(items[0].visitor_count).toBe(2)
    expect(items[0].view_count).toBe(6) // 3 + 2 + 1
  })

  it('sums view_count from visit_count across all matched rows', async () => {
    const { items } = await fetchLabelTrend(db, 'label_ids=label-2&start=2026-06-10&end=2026-06-10')
    expect(items).toHaveLength(1)
    expect(items[0].visitor_count).toBe(1)
    expect(items[0].view_count).toBe(2)
  })

  it('pads missing dates between start and end with zero rows', async () => {
    // 2026-06-10 → 2026-06-12 = 3 days. label-1 has data on 10 and 11, missing on 12.
    const { items } = await fetchLabelTrend(db, 'label_ids=label-1&start=2026-06-10&end=2026-06-12')
    expect(items.map((i) => i.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12'])
    expect(items[0].visitor_count).toBe(2)
    expect(items[1].visitor_count).toBe(1)
    expect(items[2].visitor_count).toBe(0)
    expect(items[2].view_count).toBe(0)
  })

  it('returns rows for every selected label even when one has no data', async () => {
    // 2026-06-11: label-2 has no data → still returns zero row for it
    const { items } = await fetchLabelTrend(db, 'label_ids=label-1,label-2&start=2026-06-11&end=2026-06-11')
    expect(items).toHaveLength(2)
    const byLabel = new Map(items.map((i) => [i.label_id, i]))
    expect(byLabel.get('label-1')?.visitor_count).toBe(1)
    expect(byLabel.get('label-2')?.visitor_count).toBe(0)
  })

  it('orders rows by date then by label sort ascending', async () => {
    // 2026-06-10: both labels have data. label-1 (sort=10) should come before label-2 (sort=20).
    const { items } = await fetchLabelTrend(db, 'label_ids=label-2,label-1&start=2026-06-10&end=2026-06-10')
    expect(items.map((i) => i.label_id)).toEqual(['label-1', 'label-2'])
  })

  it('filters by shop_id when provided', async () => {
    // p-C is shop-2 → label-2 should be empty under shop-1 filter
    const { items } = await fetchLabelTrend(db, 'label_ids=label-2&start=2026-06-10&end=2026-06-10&shop_id=shop-1')
    expect(items).toHaveLength(1)
    expect(items[0].visitor_count).toBe(0)
  })

  it('ignores empty label_ids entries from trailing comma', async () => {
    const { status, items } = await fetchLabelTrend(db, 'label_ids=label-1,&start=2026-06-10&end=2026-06-10')
    expect(status).toBe(200)
    expect(items).toHaveLength(1)
    expect(items[0].label_id).toBe('label-1')
  })
})

describe('GET /stats/label-tx-trend', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('returns empty items when label_ids is missing', async () => {
    const { status, items } = await fetchLabelTxTrend(db, 'start=2026-06-10&end=2026-06-11')
    expect(status).toBe(200)
    expect(items).toEqual([])
  })

  it('aggregates transaction count and amount by label and date', async () => {
    // 2026-06-10: label-1 (p-A: 10*2=20), label-2 (p-C: 5*1=5)
    const { items } = await fetchLabelTxTrend(db, 'label_ids=label-1,label-2&start=2026-06-10&end=2026-06-10')
    expect(items).toHaveLength(2)
    const byLabel = new Map(items.map((i) => [i.label_id, i]))
    expect(byLabel.get('label-1')?.tx_count).toBe(1)
    expect(byLabel.get('label-1')?.tx_amount).toBe(20)
    expect(byLabel.get('label-2')?.tx_count).toBe(1)
    expect(byLabel.get('label-2')?.tx_amount).toBe(5)
  })

  it('pads missing dates with zero rows', async () => {
    // 2026-06-13 to 2026-06-14: no tx in this range → all zero rows
    const { items } = await fetchLabelTxTrend(db, 'label_ids=label-1&start=2026-06-13&end=2026-06-14')
    expect(items).toHaveLength(2)
    expect(items.every((i) => i.tx_count === 0 && i.tx_amount === 0)).toBe(true)
  })

  it('returns rows in date order with labels sorted ascending by sort', async () => {
    const { items } = await fetchLabelTxTrend(db, 'label_ids=label-2,label-1&start=2026-06-10&end=2026-06-10')
    expect(items.map((i) => i.label_id)).toEqual(['label-1', 'label-2'])
  })

  it('filters transactions by shop_id', async () => {
    // shop-1 only: label-2 (p-C is shop-2) → no tx
    const { items } = await fetchLabelTxTrend(db, 'label_ids=label-2&start=2026-06-10&end=2026-06-10&shop_id=shop-1')
    expect(items).toHaveLength(1)
    expect(items[0].tx_count).toBe(0)
  })
})

async function fetchLabelProducts(
  db: LocalD1,
  query: string,
): Promise<{ status: number; items: LabelProductStat[] }> {
  const res = await statsRoutes.fetch(
    new Request(`http://localhost/label-products?${query}`),
    { DB: db },
  )
  const body = await res.json() as { items?: LabelProductStat[] }
  return { status: res.status, items: body.items ?? [] }
}

describe('GET /stats/label-products', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('returns empty items when label_id is missing', async () => {
    const { status, items } = await fetchLabelProducts(db, 'date=2026-06-10')
    expect(status).toBe(200)
    expect(items).toEqual([])
  })

  it('returns empty items when date is missing', async () => {
    const { status, items } = await fetchLabelProducts(db, 'label_id=label-1')
    expect(status).toBe(200)
    expect(items).toEqual([])
  })

  it('returns per-product breakdown sorted by visitor_count desc', async () => {
    // 2026-06-10 label-1: p-A (v-1 + v-2 → 2 visitors, 3+1=4 views), p-B (v-1 → 1 visitor, 2 views)
    const { status, items } = await fetchLabelProducts(db, 'label_id=label-1&date=2026-06-10')
    expect(status).toBe(200)
    expect(items.map((i) => i.id)).toEqual(['p-A', 'p-B'])
    const a = items[0]
    const b = items[1]
    expect(a.visitor_count).toBe(2)
    expect(a.view_count).toBe(4)
    expect(b.visitor_count).toBe(1)
    expect(b.view_count).toBe(2)
  })

  it('limits results to the requested label', async () => {
    // label-2 only owns p-C; p-A/p-B must not appear
    const { items } = await fetchLabelProducts(db, 'label_id=label-2&date=2026-06-10')
    expect(items.map((i) => i.id)).toEqual(['p-C'])
    expect(items[0].visitor_count).toBe(1)
    expect(items[0].view_count).toBe(2)
  })

  it('returns empty for a date with no activity', async () => {
    const { items } = await fetchLabelProducts(db, 'label_id=label-1&date=2026-06-13')
    expect(items).toEqual([])
  })

  it('filters by shop_id', async () => {
    // label-1 products p-A/p-B are both shop-1; shop-2 filter → empty
    const { items } = await fetchLabelProducts(db, 'label_id=label-1&date=2026-06-10&shop_id=shop-2')
    expect(items).toEqual([])
  })
})

async function fetchLabelSales(
  db: LocalD1,
  query: string,
): Promise<{ status: number; items: LabelSalesItem[] }> {
  const res = await statsRoutes.fetch(
    new Request(`http://localhost/label-sales?${query}`),
    { DB: db },
  )
  const body = await res.json() as { items?: LabelSalesItem[] }
  return { status: res.status, items: body.items ?? [] }
}

describe('GET /stats/label-sales', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('returns all labels sorted by tx_quantity desc (all-time)', async () => {
    // label-1: t-1 (qty 2) + t-3 (qty 1) = 3; label-2: t-2 (qty 1) = 1
    const { status, items } = await fetchLabelSales(db, '')
    expect(status).toBe(200)
    expect(items.map((i) => i.label_id)).toEqual(['label-1', 'label-2'])
    expect(items[0].tx_quantity).toBe(3)
    expect(items[1].tx_quantity).toBe(1)
  })

  it('aggregates within a date range', async () => {
    // 2026-06-10 only: label-1 = t-1 (2), label-2 = t-2 (1)
    const { items } = await fetchLabelSales(db, 'start=2026-06-10&end=2026-06-10')
    expect(items.map((i) => i.label_id)).toEqual(['label-1', 'label-2'])
    expect(items[0].tx_quantity).toBe(2)
    expect(items[1].tx_quantity).toBe(1)
  })

  it('keeps zero-sales labels (sorted last) via LEFT JOIN', async () => {
    // 2026-06-12 only: label-1 = t-3 (1); label-2 has no tx that day → 0
    const { items } = await fetchLabelSales(db, 'start=2026-06-12&end=2026-06-12')
    expect(items.map((i) => i.label_id)).toEqual(['label-1', 'label-2'])
    expect(items[0].tx_quantity).toBe(1)
    expect(items[1].tx_quantity).toBe(0)
  })

  it('filters by shop_id while keeping other labels at zero', async () => {
    // shop-1 only: label-1 (p-A shop-1) = 3; label-2 (p-C shop-2) = 0
    const { items } = await fetchLabelSales(db, 'shop_id=shop-1')
    const byLabel = new Map(items.map((i) => [i.label_id, i.tx_quantity]))
    expect(byLabel.get('label-1')).toBe(3)
    expect(byLabel.get('label-2')).toBe(0)
  })
})
