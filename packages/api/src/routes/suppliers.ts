import { Hono } from 'hono'
import crypto from 'crypto'

const ENCRYPT_KEY = 'wxtdefgabcdawn12'

// AES-128-ECB 解密
function aesDecrypt(base64Str: string, keyStr: string): string {
  const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(keyStr, 'utf8'), null)
  let decrypted = decipher.update(base64Str, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// 尝试将文本解密为 JSON，如果不是密文则返回 null
function tryDecrypt(text: string): any | null {
  try {
    const decrypted = aesDecrypt(text, ENCRYPT_KEY)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

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
  const db = c.env.DB

  const wechatId = wechat_id || ''
  if (wechatId) {
    const existing = await db.prepare('SELECT id FROM suppliers WHERE wechat_id = ?').bind(wechatId).first()
    if (existing) {
      return c.json({ error: '该微信号已存在，请使用其他微信号' }, 400)
    }
  }

  const id = crypto.randomUUID()
  await db.prepare('INSERT INTO suppliers (id, wechat_nickname, wechat_id, remark) VALUES (?, ?, ?, ?)')
    .bind(id, wechat_nickname, wechatId, remark || '').run()
  return c.json({ id, wechat_nickname, wechat_id: wechatId, remark })
})

suppliers.put('/:id', async (c) => {
  const { wechat_nickname, wechat_id, remark } = await c.req.json()
  const db = c.env.DB
  const supplierId = c.req.param('id')

  const wechatId = wechat_id || ''
  if (wechatId) {
    const existing = await db.prepare('SELECT id FROM suppliers WHERE wechat_id = ? AND id != ?').bind(wechatId, supplierId).first()
    if (existing) {
      return c.json({ error: '该微信号已存在，请使用其他微信号' }, 400)
    }
  }

  await db.prepare('UPDATE suppliers SET wechat_nickname = ?, wechat_id = ?, remark = ?, updated_at = datetime("now") WHERE id = ?')
    .bind(wechat_nickname, wechatId, remark || '', supplierId).run()
  return c.json({ message: '更新成功' })
})

suppliers.delete('/:id', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM suppliers WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: '删除成功' })
})

// --- cURL 解析 ---

interface CurlParseResult {
  success: boolean
  data?: { image_url: string; description: string; price: string; product_code: string }
  error?: string
  raw?: unknown
}

function parseCurl(curlStr: string): { method: string; url: string; headers: Record<string, string>; body?: string } {
  let method = 'GET'
  let url = ''
  const headers: Record<string, string> = {}
  let body: string | undefined

  let cmd = curlStr.trim().replace(/^\s*curl\s+/, '').replace(/\\\n/g, ' ').replace(/\\\r\n/g, ' ')

  const methodMatch = cmd.match(/-X\s+(\w+)/)
  if (methodMatch) {
    method = methodMatch[1]
    cmd = cmd.replace(/-X\s+\w+/, '')
  }

  const dataMatch = cmd.match(/(?:-d|--data(?:-raw)?)\s+(['"])([\s\S]*?)\1/) || cmd.match(/(?:-d|--data(?:-raw)?)\s+([^\s]+)/)
  if (dataMatch) {
    body = dataMatch[2] || dataMatch[1]
    method = method === 'GET' ? 'POST' : method
    cmd = cmd.replace(/(?:-d|--data(?:-raw)?)\s+(?:['"][\s\S]*?['"]|[^\s]+)/, '')
  }

  const headerRegex = /-H\s+(['"])([^'"]+)\1/g
  let hMatch
  while ((hMatch = headerRegex.exec(cmd)) !== null) {
    const h = hMatch[2]
    const colonIdx = h.indexOf(':')
    if (colonIdx > 0) {
      headers[h.slice(0, colonIdx).trim()] = h.slice(colonIdx + 1).trim()
    }
  }
  cmd = cmd.replace(/-H\s+(['"])[^'"]+\1/g, '')

  // 解析 -b / --cookie 标志
  const cookieMatch = cmd.match(/(?:-b|--cookie)\s+(['"])([^'"]+)\1/) || cmd.match(/(?:-b|--cookie)\s+([^\s]+)/)
  if (cookieMatch) {
    headers['cookie'] = cookieMatch[2] || cookieMatch[1]
    cmd = cmd.replace(/(?:-b|--cookie)\s+(?:['"][^'"]*['"]|[^\s]+)/, '')
  }

  const urlMatch = cmd.match(/(['"])([^'"]+)\1/) || cmd.match(/(\S+)/)
  if (urlMatch) {
    url = urlMatch[2] || urlMatch[1]
  }

  return { method, url, headers, body }
}

function extractFieldsFromJson(json: any): CurlParseResult['data'] {
  if (!json || typeof json !== 'object') return undefined

  // 深入到实际数据层
  let obj = json
  if (json.data && typeof json.data === 'object') obj = json.data
  else if (json.result && typeof json.result === 'object') obj = json.result
  else if (Array.isArray(json.data) && json.data.length > 0) obj = json.data[0]
  else if (Array.isArray(json) && json.length > 0) obj = json[0]

  // 如果有 product 字段（如 gxhy1688 productPrivateDetailsV2），进入 product
  if (obj.product && typeof obj.product === 'object') obj = obj.product

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (obj[k] != null && obj[k] !== '') return String(obj[k])
    }
    return ''
  }

  // 提取图片：优先 pics.picList[0]，否则尝试常见图片字段
  let image_url = ''
  if (obj.pics?.picList?.length) {
    image_url = obj.pics.picList[0]
  }
  if (!image_url) {
    image_url = pick('picUrl', 'imageUrl', 'mainImage', 'image_url', 'img', 'image')
  }

  return {
    image_url,
    description: pick('description', 'desc', 'title', 'name', 'product_name', 'productName'),
    price: pick('price', 'unitPrice', 'salePrice', 'supplyPrice'),
    product_code: pick('code', 'sku', 'productCode', 'product_code', 'itemNo'),
  }
}

suppliers.post('/parse-curl', async (c) => {
  const { curl } = await c.req.json()
  if (!curl || typeof curl !== 'string') {
    return c.json({ success: false, error: '请提供 cURL 命令' })
  }

  try {
    const { method, url, headers, body } = parseCurl(curl)
    if (!url) {
      return c.json({ success: false, error: '无法解析出 URL' })
    }

    const fetchOptions: RequestInit = { method, headers }
    if (body && method !== 'GET') {
      fetchOptions.body = body
      if (!headers['content-type'] && !headers['Content-Type']) {
        fetchOptions.headers = { ...headers, 'Content-Type': 'application/json' }
      }
    }

    const res = await fetch(url, fetchOptions)
    const contentType = res.headers.get('content-type') || ''
    let json: any

    if (contentType.includes('json')) {
      json = await res.json()
    } else {
      const text = await res.text()
      // 尝试直接解析 JSON
      try { json = JSON.parse(text) } catch { json = null }
      // 如果不是有效 JSON，尝试作为密文解密
      if (!json) {
        const trimmed = text.trim()
        json = tryDecrypt(trimmed)
      }
    }

    // 如果 JSON 响应体本身是加密字符串（如 { "data": "加密base64..." } 或直接返回加密字符串）
    if (json && typeof json === 'string') {
      const decrypted = tryDecrypt(json)
      if (decrypted) json = decrypted
    }

    if (!json) {
      return c.json({ success: false, error: '响应不是有效的 JSON' })
    }

    const data = extractFieldsFromJson(json)
    if (!data) {
      return c.json({ success: false, error: '无法从响应中提取商品字段', raw: json })
    }

    return c.json({ success: true, data, raw: json })
  } catch (err: any) {
    return c.json({ success: false, error: err.message || '解析失败' })
  }
})

// --- 全量商品-供应商关联（搜索） ---

suppliers.get('/all-products', async (c) => {
  const db = c.env.DB
  const search = c.req.query('search')?.trim() || ''
  const supplierId = c.req.query('supplier_id') || ''
  const productId = c.req.query('product_id') || ''
  const labelId = c.req.query('label_id') || ''

  let sql = `
    SELECT ps.*, p.name AS product_name, p.image_url AS product_image,
           p.description AS product_description, p.sku AS product_sku,
           p.price AS product_price, s.wechat_nickname AS supplier_name
    FROM product_suppliers ps
    JOIN products p ON ps.product_id = p.id
    JOIN suppliers s ON ps.supplier_id = s.id
    WHERE 1=1
  `
  const params: string[] = []

  if (supplierId) {
    sql += ' AND ps.supplier_id = ?'
    params.push(supplierId)
  }

  if (productId) {
    sql += ' AND ps.product_id = ?'
    params.push(productId)
  }

  if (labelId) {
    sql += ' AND ps.product_id IN (SELECT product_id FROM product_label_relations WHERE label_id = ?)'
    params.push(labelId)
  }

  if (search) {
    sql += ' AND (s.wechat_nickname LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR p.name LIKE ?)'
    const like = `%${search}%`
    params.push(like, like, like, like)
  }

  sql += ' ORDER BY ps.created_at DESC'

  const stmt = db.prepare(sql)
  const result = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all()
  return c.json(result.results)
})

// --- 商品-供应商关联 CRUD ---

suppliers.post('/link', async (c) => {
  const { product_id, supplier_id, price, note } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  const result = await db.prepare(`
    INSERT INTO product_suppliers (id, product_id, supplier_id, price, note) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(product_id, supplier_id) DO UPDATE SET price = excluded.price, note = excluded.note, updated_at = datetime('now')
    RETURNING id, product_id, supplier_id, price, note
  `).bind(id, product_id, supplier_id, price || '', note || '').first()
  return c.json(result)
})

suppliers.put('/link/:id', async (c) => {
  const { price, note, supplier_id } = await c.req.json()
  const db = c.env.DB
  if (supplier_id) {
    await db.prepare('UPDATE product_suppliers SET supplier_id = ?, price = ?, note = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(supplier_id, price || '', note || '', c.req.param('id')).run()
  } else {
    await db.prepare('UPDATE product_suppliers SET price = ?, note = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(price || '', note || '', c.req.param('id')).run()
  }
  return c.json({ message: '更新成功' })
})

suppliers.delete('/link/:id', async (c) => {
  const db = c.env.DB
  await db.prepare('DELETE FROM product_suppliers WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ message: '删除成功' })
})

// --- 拿货记录 CRUD ---

suppliers.get('/:supplierId/purchases', async (c) => {
  const db = c.env.DB
  const result = await db.prepare(`
    SELECT pr.*, p.name AS product_name, p.image_url AS product_image,
           p.description AS product_description, p.sku AS product_sku
    FROM purchase_records pr
    JOIN product_suppliers ps ON pr.product_supplier_id = ps.id
    JOIN products p ON ps.product_id = p.id
    WHERE ps.supplier_id = ?
    ORDER BY pr.purchase_date DESC, pr.created_at DESC
  `).bind(c.req.param('supplierId')).all()
  return c.json(result.results)
})

suppliers.post('/:supplierId/purchases', async (c) => {
  const { product_supplier_id, price, quantity, purchase_date, note } = await c.req.json()
  const id = crypto.randomUUID()
  const db = c.env.DB
  await db.prepare('INSERT INTO purchase_records (id, product_supplier_id, price, quantity, purchase_date, note) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, product_supplier_id, price, quantity || 1, purchase_date, note || '').run()
  return c.json({ id, product_supplier_id, price, quantity, purchase_date, note })
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
