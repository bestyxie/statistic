import { Hono } from 'hono'

type Env = { DB: D1Database }

const shops = new Hono<{ Bindings: Env }>()

shops.get('/', async (c) => {
  const db = c.env.DB
  const result = await db.prepare('SELECT * FROM shops ORDER BY created_at DESC').all()
  return c.json(result.results)
})

shops.post('/', async (c) => {
  const { name, platform } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  await db.prepare('INSERT INTO shops (id, name, platform) VALUES (?, ?, ?)').bind(id, name, platform || '').run()
  return c.json({ id, name, platform })
})

shops.put('/:id', async (c) => {
  const { name, platform } = await c.req.json()
  const db = c.env.DB
  await db.prepare('UPDATE shops SET name = ?, platform = ?, updated_at = datetime("now") WHERE id = ?')
    .bind(name, platform || '', c.req.param('id')).run()
  return c.json({ message: '更新成功' })
})

shops.delete('/:id', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM shops WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: '删除成功' })
})

export default shops
