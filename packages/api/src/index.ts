import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { verifyJWT } from './utils/crypto'
import authRoutes from './routes/auth'
import shopRoutes from './routes/shops'
import productRoutes from './routes/products'
import statsRoutes from './routes/stats'
import supplierRoutes from './routes/suppliers'
import labelRoutes from './routes/labels'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use('*', cors())

// Global error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message, stack: err.stack?.slice(0, 200) }, 500)
})

// Auth routes (public)
app.route('/auth', authRoutes)

// JWT auth middleware
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/auth')) return next()

  const header = c.req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return c.json({ error: '未登录' }, 401)
  }

  try {
    const token = header.slice(7)
    await verifyJWT(token, c.env.JWT_SECRET)
    await next()
  } catch {
    return c.json({ error: '登录已过期，请重新登录' }, 401)
  }
})

// Protected routes
app.route('/shops', shopRoutes)
app.route('/products', productRoutes)
app.route('/stats', statsRoutes)
app.route('/suppliers', supplierRoutes)
app.route('/labels', labelRoutes)

export default app
