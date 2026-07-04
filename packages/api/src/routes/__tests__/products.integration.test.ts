import { beforeEach, describe, expect, it } from 'vitest'
import productsRoutes from '../products'
import { createInMemoryD1, type LocalD1 } from '../../local-db'
import type { ProductNote } from '@statistic/shared'

interface ProductRow {
  id: string
  latest_note_content: string | null
  latest_note_at: string | null
}

async function seedFixture(db: LocalD1): Promise<void> {
  await db.prepare("INSERT INTO shops (id, name) VALUES (?, ?)").bind('shop-1', 'Shop 1').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-A', 'shop-1', 'A', 'A').run()
  await db.prepare("INSERT INTO products (id, shop_id, name, sku) VALUES (?, ?, ?, ?)").bind('p-B', 'shop-1', 'B', 'B').run()

  // p-A 两条备注（固定 created_at，便于断言「最近一条」）
  await db.prepare("INSERT INTO product_notes (id, product_id, content, created_at) VALUES (?, ?, ?, ?)")
    .bind('n-A1', 'p-A', '第一备注', '2026-06-10 10:00:00').run()
  await db.prepare("INSERT INTO product_notes (id, product_id, content, created_at) VALUES (?, ?, ?, ?)")
    .bind('n-A2', 'p-A', '第二备注', '2026-06-12 12:00:00').run()
  // p-B 一条
  await db.prepare("INSERT INTO product_notes (id, product_id, content, created_at) VALUES (?, ?, ?, ?)")
    .bind('n-B1', 'p-B', 'B的备注', '2026-06-11 00:00:00').run()
}

async function fetchList(db: LocalD1, query: string): Promise<{ status: number; items: ProductRow[] }> {
  const res = await productsRoutes.fetch(new Request(`http://localhost/?${query}`), { DB: db })
  const body = await res.json() as { items?: ProductRow[] }
  return { status: res.status, items: body.items ?? [] }
}

async function fetchNotes(db: LocalD1, productId: string): Promise<{ status: number; items: ProductNote[] }> {
  const res = await productsRoutes.fetch(new Request(`http://localhost/${productId}/notes`), { DB: db })
  const body = await res.json() as ProductNote[]
  return { status: res.status, items: Array.isArray(body) ? body : [] }
}

describe('GET /products（最近备注）', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('列表附带每个商品最近一条备注', async () => {
    const { items } = await fetchList(db, '')
    const a = items.find((p) => p.id === 'p-A')
    const b = items.find((p) => p.id === 'p-B')
    expect(a?.latest_note_content).toBe('第二备注')
    expect(a?.latest_note_at).toBe('2026-06-12 12:00:00')
    expect(b?.latest_note_content).toBe('B的备注')
  })
})

describe('GET /products/:id/notes', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('按 created_at 倒序返回全部备注', async () => {
    const { status, items } = await fetchNotes(db, 'p-A')
    expect(status).toBe(200)
    expect(items.map((n) => n.id)).toEqual(['n-A2', 'n-A1'])
  })
})

describe('POST /products/:id/notes', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('新增后成为最近一条', async () => {
    const res = await productsRoutes.fetch(
      new Request('http://localhost/p-A/notes', { method: 'POST', body: JSON.stringify({ content: '新备注' }), headers: { 'Content-Type': 'application/json' } }),
      { DB: db },
    )
    expect(res.status).toBe(200)
    const created = await res.json() as ProductNote
    expect(created.content).toBe('新备注')

    const { items } = await fetchNotes(db, 'p-A')
    expect(items).toHaveLength(3)
    expect(items[0].content).toBe('新备注')

    const { items: list } = await fetchList(db, '')
    expect(list.find((p) => p.id === 'p-A')?.latest_note_content).toBe('新备注')
  })

  it('空内容返回 400', async () => {
    const res = await productsRoutes.fetch(
      new Request('http://localhost/p-A/notes', { method: 'POST', body: JSON.stringify({ content: '   ' }), headers: { 'Content-Type': 'application/json' } }),
      { DB: db },
    )
    expect(res.status).toBe(400)
  })

  it('商品不存在返回 404', async () => {
    const res = await productsRoutes.fetch(
      new Request('http://localhost/no-such/notes', { method: 'POST', body: JSON.stringify({ content: 'x' }), headers: { 'Content-Type': 'application/json' } }),
      { DB: db },
    )
    expect(res.status).toBe(404)
  })
})

describe('DELETE /products/:id/notes/:noteId', () => {
  let db: LocalD1

  beforeEach(async () => {
    db = await createInMemoryD1()
    await seedFixture(db)
  })

  it('删除指定备注', async () => {
    const res = await productsRoutes.fetch(
      new Request('http://localhost/p-A/notes/n-A1', { method: 'DELETE' }),
      { DB: db },
    )
    expect(res.status).toBe(200)
    const { items } = await fetchNotes(db, 'p-A')
    expect(items.map((n) => n.id)).toEqual(['n-A2'])
  })
})
