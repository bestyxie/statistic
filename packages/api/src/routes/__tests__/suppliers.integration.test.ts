import { beforeEach, describe, expect, it } from 'vitest'
import suppliersRoutes from '../suppliers'
import { createInMemoryD1, type LocalD1 } from '../../local-db'

interface SupplyLink {
  id: string
  product_id: string
  supplier_id: string
}

async function seedFixture(db: LocalD1): Promise<void> {
  await db.prepare("INSERT INTO shops (id, name) VALUES (?, ?)").bind('shop-1', 'Shop 1').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-A', 'shop-1', 'A', 'A').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-B', 'shop-1', 'B', 'B').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-C', 'shop-1', 'C', 'C').run()

  await db.prepare("INSERT INTO product_labels (label_id, label_name, sort) VALUES (?, ?, ?)").bind('label-1', 'Brand One', 10).run()
  await db.prepare("INSERT INTO product_labels (label_id, label_name, sort) VALUES (?, ?, ?)").bind('label-2', 'Brand Two', 20).run()
  await db.prepare("INSERT INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)").bind('plr-A1', 'p-A', 'label-1').run()
  await db.prepare("INSERT INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)").bind('plr-B1', 'p-B', 'label-1').run()
  await db.prepare("INSERT INTO product_label_relations (id, product_id, label_id) VALUES (?, ?, ?)").bind('plr-C2', 'p-C', 'label-2').run()

  await db.prepare("INSERT INTO suppliers (id, wechat_nickname) VALUES (?, ?)").bind('s-1', 'Supplier 1').run()
  await db.prepare("INSERT INTO suppliers (id, wechat_nickname) VALUES (?, ?)").bind('s-2', 'Supplier 2').run()

  // p-A→s-1, p-B→s-2, p-C→s-1
  await db.prepare("INSERT INTO product_suppliers (id, product_id, supplier_id) VALUES (?, ?, ?)").bind('ps-A1', 'p-A', 's-1').run()
  await db.prepare("INSERT INTO product_suppliers (id, product_id, supplier_id) VALUES (?, ?, ?)").bind('ps-B2', 'p-B', 's-2').run()
  await db.prepare("INSERT INTO product_suppliers (id, product_id, supplier_id) VALUES (?, ?, ?)").bind('ps-C1', 'p-C', 's-1').run()
}

async function fetchAllProducts(db: LocalD1, query: string): Promise<{ status: number; items: SupplyLink[] }> {
  const res = await suppliersRoutes.fetch(new Request(`http://localhost/all-products?${query}`), { DB: db })
  const body = await res.json() as SupplyLink[]
  return { status: res.status, items: Array.isArray(body) ? body : [] }
}

describe('GET /suppliers/all-products', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('returns all links without filter', async () => {
    const { items } = await fetchAllProducts(db, '')
    expect(items.map((i) => i.product_id).sort()).toEqual(['p-A', 'p-B', 'p-C'])
  })

  it('filters by label_id', async () => {
    // label-1 = p-A, p-B → links ps-A1, ps-B2
    const l1 = await fetchAllProducts(db, 'label_id=label-1')
    expect(l1.items.map((i) => i.product_id).sort()).toEqual(['p-A', 'p-B'])
    // label-2 = p-C → ps-C1
    const l2 = await fetchAllProducts(db, 'label_id=label-2')
    expect(l2.items.map((i) => i.product_id)).toEqual(['p-C'])
  })

  it('combines label_id with supplier_id', async () => {
    // label-1 (p-A, p-B) + supplier s-1 → only p-A
    const r = await fetchAllProducts(db, 'label_id=label-1&supplier_id=s-1')
    expect(r.items.map((i) => i.product_id)).toEqual(['p-A'])
  })
})
