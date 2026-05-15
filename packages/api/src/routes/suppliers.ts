import { Hono } from 'hono'

type Env = { DB: D1Database }

const suppliers = new Hono<{ Bindings: Env }>()

// --- 供应商 CRUD ---

suppliers.get('/', async (c) => {
  const db = c.env.DB
  const result = await db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all()
  return c.json(result.results)
})

suppliers.post('/', async (c) => {
  const { wechat_nickname, wechat_id, remark } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  await db.prepare('INSERT INTO suppliers (id, wechat_nickname, wechat_id, remark) VALUES (?, ?, ?, ?)')
    .bind(id, wechat_nickname, wechat_id || '', remark || '').run()
  return c.json({ id, wechat_nickname, wechat_id, remark })
})

suppliers.put('/:id', async (c) => {
  const { wechat_nickname, wechat_id, remark } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE suppliers SET wechat_nickname = ?, wechat_id = ?, remark = ?, updated_at = datetime("now") WHERE id = ?')
    .bind(wechat_nickname, wechat_id || '', remark || '', c.req.param('id')).run()
  return c.json({ message: '更新成功' })
})

suppliers.delete('/:id', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM suppliers WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: '删除成功' })
})

// --- 全量供货商品（跨供应商搜索） ---

suppliers.get('/all-products', async (c) => {
  const db = c.env.DB
  const search = c.req.query('search')?.trim() || ''
  const supplierId = c.req.query('supplier_id') || ''

  let sql = `
    SELECT sp.*, s.wechat_nickname AS supplier_name
    FROM supplier_products sp
    JOIN suppliers s ON sp.supplier_id = s.id
    WHERE 1=1
  `
  const params: string[] = []

  if (supplierId) {
    sql += ' AND sp.supplier_id = ?'
    params.push(supplierId)
  }

  if (search) {
    sql += ' AND (s.wechat_nickname LIKE ? OR sp.product_code LIKE ? OR sp.description LIKE ?)'
    const like = `%${search}%`
    params.push(like, like, like)
  }

  sql += ' ORDER BY sp.created_at DESC'

  const stmt = db.prepare(sql)
  const result = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all()
  return c.json(result.results)
})

// --- 供应商商品 CRUD ---

suppliers.get('/:supplierId/products', async (c) => {
  const db = c.env.DB
  const result = await db.prepare('SELECT * FROM supplier_products WHERE supplier_id = ? ORDER BY created_at DESC')
    .bind(c.req.param('supplierId')).all()
  return c.json(result.results)
})

suppliers.post('/:supplierId/products', async (c) => {
  const { product_code, price, image_url, description } = await c.req.json()
  const id = crypto.randomUUID()
  const supplierId = c.req.param('supplierId')
  const db = c.env.DB
  await db.prepare('INSERT INTO supplier_products (id, supplier_id, product_code, price, image_url, description) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, supplierId, product_code || '', price || '', image_url || '', description || '').run()
  return c.json({ id, supplier_id: supplierId, product_code, price, image_url, description })
})

suppliers.put('/:supplierId/products/:productId', async (c) => {
  const { product_code, price, image_url, description } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE supplier_products SET product_code = ?, price = ?, image_url = ?, description = ?, updated_at = datetime("now") WHERE id = ? AND supplier_id = ?')
    .bind(product_code || '', price || '', image_url || '', description || '', c.req.param('productId'), c.req.param('supplierId')).run()
  return c.json({ message: '更新成功' })
})

suppliers.delete('/:supplierId/products/:productId', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM supplier_products WHERE id = ? AND supplier_id = ?')
    .bind(c.req.param('productId'), c.req.param('supplierId')).run()
  return c.json({ message: '删除成功' })
})

// --- 拿货记录 CRUD ---

suppliers.get('/:supplierId/purchases', async (c) => {
  const db = c.env.DB
  const result = await db.prepare(`
    SELECT pr.*, sp.product_code, sp.description, sp.image_url
    FROM purchase_records pr
    JOIN supplier_products sp ON pr.supplier_product_id = sp.id
    WHERE sp.supplier_id = ?
    ORDER BY pr.purchase_date DESC, pr.created_at DESC
  `).bind(c.req.param('supplierId')).all()
  return c.json(result.results)
})

suppliers.post('/:supplierId/purchases', async (c) => {
  const { supplier_product_id, price, quantity, purchase_date, note } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  await db.prepare('INSERT INTO purchase_records (id, supplier_product_id, price, quantity, purchase_date, note) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, supplier_product_id, price, quantity || 1, purchase_date, note || '').run()
  return c.json({ id, supplier_product_id, price, quantity, purchase_date, note })
})

suppliers.put('/:supplierId/purchases/:purchaseId', async (c) => {
  const { price, quantity, purchase_date, note } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE purchase_records SET price = ?, quantity = ?, purchase_date = ?, note = ? WHERE id = ?')
    .bind(price, quantity || 1, purchase_date, note || '', c.req.param('purchaseId')).run()
  return c.json({ message: '更新成功' })
})

suppliers.delete('/:supplierId/purchases/:purchaseId', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM purchase_records WHERE id = ?').bind(c.req.param('purchaseId')).run()
  return c.json({ message: '删除成功' })
})

export default suppliers
