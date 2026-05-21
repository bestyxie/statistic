import { Hono } from 'hono'
import { signJWT, hashPassword } from '../utils/crypto'

type Env = { DB: D1Database; JWT_SECRET: string }

const auth = new Hono<{ Bindings: Env }>()

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  const db = c.env.DB

  const user = await db.prepare('SELECT * FROM admin_users WHERE username = ?').bind(username).first()
  if (!user) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const hash = await hashPassword(password)
  if (hash !== user.password_hash) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const payload = { sub: user.id as string, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }
  const token = await signJWT(payload, c.env.JWT_SECRET)

  return c.json({ token, user: { id: user.id, username: user.username } })
})

auth.post('/setup', async (c) => {
  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM admin_users LIMIT 1').first()
  if (existing) {
    return c.json({ error: '管理员账号已存在' }, 400)
  }

  const { username, password } = await c.req.json()
  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400)
  }

  const hash = await hashPassword(password)
  const id = crypto.randomUUID()
  await db.prepare('INSERT INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)').bind(id, username, hash).run()

  return c.json({ message: '管理员账号创建成功' })
})

auth.get('/check', async (c) => {
  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM admin_users LIMIT 1').first()
  return c.json({ hasAdmin: !!existing })
})

export default auth
