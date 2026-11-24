import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import productsRoutes from '../products'
import { createInMemoryD1, type LocalD1 } from '../../local-db'
import type { PriceCompareItem } from '@statistic/shared'

/** gxhy 以图搜图接口返回的原始商品（仅测试用到的字段） */
interface GxhyItem {
  title: string
  address: string
  price: number | null
  pics: { picList: string[] }
}

function gxhyBody(sortList: GxhyItem[] | null): string {
  return JSON.stringify({ encrypt: false, success: true, data: { region: [], sortList, requestId: 'r-1' } })
}

async function callCompare(db: LocalD1, productId: string): Promise<Response> {
  return productsRoutes.fetch(new Request(`http://localhost/${productId}/price-compare`, { method: 'POST' }), { DB: db })
}

describe('POST /products/:id/price-compare', () => {
  let db: LocalD1
  const fetchMock = vi.fn()

  beforeEach(async () => {
    db = await createInMemoryD1()
    await db.prepare("INSERT INTO shops (id, name) VALUES (?, ?)").bind('shop-1', 'Shop 1').run()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('下载封面图并调 gxhy 接口，返回保持接口原顺序的精简结果（不排序）', async () => {
    await db.prepare("INSERT INTO products (id, shop_id, name, image_url, price) VALUES (?, ?, ?, ?, ?)")
      .bind('p-A', 'shop-1', 'A', 'http://img.example.com/cover.jpg', '160').run()

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'http://img.example.com/cover.jpg') {
        return new Response(new Uint8Array([1, 2, 3]))
      }
      return new Response(gxhyBody([
        { title: '贵的', address: '档口乙', price: 300, pics: { picList: ['http://img.example.com/2.jpg'] } },
        { title: '便宜的', address: '档口甲', price: 80, pics: { picList: ['http://img.example.com/1.jpg'] } },
        { title: '无价', address: '档口丙', price: null, pics: { picList: ['http://img.example.com/3.jpg'] } },
      ]))
    })

    const res = await callCompare(db, 'p-A')
    expect(res.status).toBe(200)
    const body = await res.json() as { items: PriceCompareItem[]; myPrice: number | null }

    expect(body.myPrice).toBe(160)
    expect(body.items.map((i) => i.title)).toEqual(['贵的', '便宜的', '无价'])
    expect(body.items[0]).toEqual({
      title: '贵的',
      merchant: '档口乙',
      price: 300,
      imageUrl: 'http://img.example.com/2.jpg',
    })

    // 第二跳 fetch：FormData 携带 file + index=0
    const gxhyCall = fetchMock.mock.calls.find(([u]) => String(u).includes('getImgSearchResultV2'))
    expect(gxhyCall).toBeTruthy()
    const sent = gxhyCall?.[1] as RequestInit
    expect(sent.method).toBe('POST')
    expect(sent.body).toBeInstanceOf(FormData)
    const form = sent.body as FormData
    expect(form.get('index')).toBe('0')
    expect(form.get('file')).toBeTruthy()
  })

  it('gxhy 返回 sortList 为 null 时返回空列表', async () => {
    await db.prepare("INSERT INTO products (id, shop_id, name, image_url, price) VALUES (?, ?, ?, ?, ?)")
      .bind('p-A', 'shop-1', 'A', 'http://img.example.com/cover.jpg', '').run()

    fetchMock.mockImplementation(async () => new Response(gxhyBody(null)))

    const res = await callCompare(db, 'p-A')
    expect(res.status).toBe(200)
    const body = await res.json() as { items: PriceCompareItem[]; myPrice: number | null }
    expect(body.items).toEqual([])
    expect(body.myPrice).toBeNull()
  })

  it('商品不存在或无封面图返回 400', async () => {
    const missing = await callCompare(db, 'p-X')
    expect(missing.status).toBe(400)

    await db.prepare("INSERT INTO products (id, shop_id, name) VALUES (?, ?, ?)").bind('p-B', 'shop-1', 'B').run()
    const noImage = await callCompare(db, 'p-B')
    expect(noImage.status).toBe(400)
    const body = await noImage.json() as { error: string }
    expect(body.error).toBe('该商品没有封面图，无法比价')
  })

  it('封面图下载失败返回 502', async () => {
    await db.prepare("INSERT INTO products (id, shop_id, name, image_url) VALUES (?, ?, ?, ?)")
      .bind('p-A', 'shop-1', 'A', 'http://img.example.com/cover.jpg').run()

    fetchMock.mockImplementation(async () => new Response('not found', { status: 404 }))

    const res = await callCompare(db, 'p-A')
    expect(res.status).toBe(502)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('封面图下载失败')
  })

  it('gxhy 业务失败时透传其错误信息', async () => {
    await db.prepare("INSERT INTO products (id, shop_id, name, image_url) VALUES (?, ?, ?, ?)")
      .bind('p-A', 'shop-1', 'A', 'http://img.example.com/cover.jpg').run()

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'http://img.example.com/cover.jpg') {
        return new Response(new Uint8Array([1]))
      }
      return new Response(JSON.stringify({ success: false, msg: '图片长或宽不能小于100PX，请重新选择图片后再试' }))
    })

    const res = await callCompare(db, 'p-A')
    expect(res.status).toBe(502)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('图片长或宽不能小于100PX，请重新选择图片后再试')
  })

  it('gxhy 网络异常返回 502 比价服务暂不可用', async () => {
    await db.prepare("INSERT INTO products (id, shop_id, name, image_url) VALUES (?, ?, ?, ?)")
      .bind('p-A', 'shop-1', 'A', 'http://img.example.com/cover.jpg').run()

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'http://img.example.com/cover.jpg') {
        return new Response(new Uint8Array([1]))
      }
      throw new Error('network down')
    })

    const res = await callCompare(db, 'p-A')
    expect(res.status).toBe(502)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('比价服务暂不可用')
  })
})
