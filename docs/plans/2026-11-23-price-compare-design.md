# 商品比价（以图搜图）设计

> 日期：2026-11-23。调研背景见 [gxhy1688 以图搜图接口研究](../research/2026-11-23-gxhy1688-image-search-api.md)。

## 需求

商品管理页操作列新增「比价」按钮：点击后用该商品封面图调 gxhy1688 以图搜图接口，抽屉展示结果（封面图、商家名称、价格），并与本店价格对比。

已确认的产品决策：

- 结果按价格升序，**低于本店价的显示红色**（醒目提示低价），其余灰色；无价格沉底
- 只取第一页（约 96 条，相似度最高），不做翻页
- 仅桌面端（操作列是桌面概念），MobileProducts 不加

## 后端

新增路由 `POST /products/:id/price-compare`（`packages/api/src/routes/products.ts`，复用 `/products/refresh` 的第三方调用模式）：

1. D1 查商品 `image_url`、`price`；无图 → 400「该商品没有封面图，无法比价」
2. `fetch(image_url)` 下载封面图，8s 超时（`AbortSignal.timeout`）；失败 → 502「封面图下载失败」
3. FormData（`file` + `index=0`）POST `https://api.gxhy1688.com/personProduct/getImgSearchResultV2.action`，15s 超时；`success:false` → 502 透传其 `msg`；网络失败 → 502「比价服务暂不可用」
4. 服务端映射为精简结果返回，前端不接触原始 90 字段结构

不做缓存、不做每日限额（比价只读不写库，YAGNI）。

## 共享类型（packages/shared）

```ts
interface PriceCompareItem {
  title: string        // sortList[].title
  merchant: string     // sortList[].address（档口/商家名）
  price: number | null // sortList[].price；null 沉底
  imageUrl: string     // sortList[].pics.picList[0]
}
interface PriceCompareResult {
  items: PriceCompareItem[]
  myPrice: number | null // 本店 price，D1 字段
}
```

## 前端

- `Products.tsx` 操作列「备注」后、「更多 ▾」前加「比价」按钮（`text-cyan-600`），点击 `setCompareProduct(p)`
- 新组件 `packages/web/src/pages/products/PriceCompareDrawer.tsx`，Props：`{ product: Product | null; onClose: () => void }`，取数内聚（遵循组件封装原则）
- 壳用 `Modal variant="drawer"`，持续挂载让退出动画可播（与 TransactionModal 一致）
- 结构：头部本商品卡（缩略图 + 描述截断 + 本店价）→ 统计行（共 N 家、最低价、低于本店 M 家）→ 结果列表（封面图 64px + 商家 + 标题两行截断 + 价格）
- 图片点击复用 `useImagePreview`
- `api.ts` 加 `priceCompare(productId)`

## 测试

- API：`price-compare.integration.test.ts`（`vi.stubGlobal('fetch')` mock 图片下载与 gxhy 两跳）：成功映射、sortList null 兜底、无图 400、下载失败 502、gxhy 业务失败 502、null 价沉底
- Web：`PriceCompareDrawer.unit.test.tsx`（mock `api.priceCompare`）：加载态、成功渲染与红色高亮、失败重试
- 现有 `/products/refresh` 无测试（外部接口），本次不补
