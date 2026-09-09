# 通用 Modal 壳组件设计

日期：2026-09-08
状态：已确认

## 背景与目标

项目约 20 个弹窗各自手写遮罩/定位/关闭外壳（`fixed inset-0 bg-black/50 ...` 重复 21+ 处），行为不一致：

- 点击遮罩关闭：有的有，有的没有（表单类防误触）
- Esc 关闭：全项目没有
- 滚动锁定：只有 4 个组件做了，且嵌套场景有 bug（父先关会错误恢复 body 滚动）
- z-index 靠魔法数手动递增（z-50 / z-[60]）

目标：抽一个只负责**遮罩/定位/关闭**的通用壳组件，弹窗显示期间禁用页面滚动，全部现有弹窗迁移到壳组件。

## 壳组件 API

新建 `packages/web/src/components/ui/Modal.tsx`（项目首个 UI 基础组件，独立 `ui/` 目录与业务组件区分）：

```tsx
interface ModalProps {
  /** 由业务组件控制，通常传业务触发值是否非空 */
  open: boolean
  onClose: () => void
  /** 'center'（默认）居中弹窗；'drawer' 右侧滑出全高面板 */
  variant?: 'center' | 'drawer'
  /** 宽度档位，仅 center 变体生效 */
  size?: 'sm' | 'md' | 'lg' | 'xl' // 默认 'md'
  /** 表单类弹窗设 true：点遮罩/Esc 不关闭，防误触丢数据 */
  disableClose?: boolean
  /** 面板额外样式逃生口（个别特殊尺寸/结构） */
  panelClassName?: string
  children: React.ReactNode
}
```

不内置 header/标题/关闭按钮——各弹窗头部差异大，由 children 自带（YAGNI）。不引入 radix 等无头库。

## 尺寸

基于现有 40 处面板类名盘点：

- 宽度 `size` 预设：`sm`→max-w-sm、`md`→max-w-md、`lg`→max-w-lg、`xl`→max-w-2xl。覆盖 36/40 处；自定义 px 的 4 处（400/480/560）归档到相邻档位，例外用 `panelClassName`。
- 高度：壳统一 `max-h-[85vh]`（现有 80/85/90vh 混用属复制漂移，取中间档归一）。面板 `w-full` + 遮罩 `p-2 sm:p-4` 固化在壳里。内部滚动结构（头部固定+内容区滚）由业务 children 自己控制。
- drawer 变体：现有 3 个 Drawer 已统一的 `w-full sm:w-[90vw] sm:max-w-[1200px]` 写死在 variant，无尺寸 prop。

## 滚动锁定

页面滚动在 `body`（Layout 是 min-h-screen，无内部滚动容器）。抽 `hooks/useScrollLock.ts`：

- 模块级**引用计数**：打开的壳 `acquire`，关闭/卸载 `release`，归零才恢复 `body` 原始 overflow。
- 修复现有嵌套 bug：Drawer 里开 Modal、Drawer 先关，不会错误恢复滚动。
- 弹窗显示期间（open=true）页面滚动禁用——核心需求。

## Esc 与嵌套关闭

- 每个 open 的壳监听 document keydown；模块级维护打开栈，**只有栈顶响应 Esc**，避免一次 Esc 父子全关。
- 顶层判定用 **React 树深度**（ModalDepthContext 传递），不能用 DOM 顺序：portal 后嵌套弹窗同一次 commit 挂载时子先插入 body，DOM 顺序与嵌套关系相反；同层则更晚打开者为栈顶。
- `disableClose` 同时禁遮罩点击与 Esc（表单类）。

## 进出场动画（2026-09-09 增补）

- 状态机 `closed → open → exiting → closed`：壳内 `mounted`（门控卸载）+ `exiting`（切换进/出动画方向）两态实现；`EXIT_MS = 150ms` 与 index.css 出场 duration 一致。退出窗口内重新打开则取消挂起的卸载、回到进场态。
- 动画定义在 index.css 的 `@theme`（Tailwind v4 由 `--animate-*` 变量生成 `animate-*` 工具类）：center 变体 fade+scale（0.2s 进 / 0.15s 出），drawer 变体遮罩 fade + 面板 slide（0.25s 进 / 0.15s 出）。
- **退出期间冻结内容**：业务惯例是 onClose 同时清数据（`setProduct(null)`），children 立即拿到空 props 会闪空白。壳在最后一个 open 帧把 children 存进 ref，退出窗口内渲染该快照（ReactNode 不可变，旧 props 渲染）。
- Esc 监听的挂载条件用 `mounted` 而非 `open`：退出窗口内按键仍响应。
- `useScrollLock` 仍随 `open` 解锁（遮罩淡出中即可滚动，与 Radix 行为一致）。
- **调用方要求**：必须持续渲染（`<XxxModal product={x}/>` 而非 `{x && <XxxModal/>}`），否则关闭时直接卸载、跳过退出动画。为此各弹窗组件去掉 `if (!x) return null` 守卫、`open={!!x}` 下沉进 Modal；表单类组件（TransactionModal / AddSupplierModal / SupplierForm）补「props 变化时重置表单」effect，替代原先靠重挂载的重置。

## z-index 分层

所有 Modal 壳统一 `z-50`。**壳用 `createPortal` 挂到 `document.body`**（2026-09-09 修复：原内联渲染时，页面根容器的 `space-y-*` 会给非末位子元素打 margin-block-end，`fixed inset-0` 的遮罩高度被 24px margin 压短，底部盖不住）。嵌套弹窗（如 Drawer 内的访客列表）同层级靠 portal 顺序追加自然覆盖，消掉 `z-[60]` 手动加层。保留两个特例不动：

- `MobileImagePreview` z-[70]（弹窗内看大图，需恒在上）
- `HoverPopup` z-[80]

最终全项目 overlay 只剩 3 层：50 / 70 / 80。

## 测试

按 `docs/testing-standards.md`：

- `useScrollLock` 属纯逻辑自定义 hook，必须测：acquire/release、嵌套、先关父、卸载归零等分支，覆盖率 100%。测试文件 `hooks/__tests__/useScrollLock.unit.test.ts`。
- Modal 壳的 Esc/遮罩点击/disableClose 行为用 testing-library 覆盖。
- web 包新增 vitest + jsdom + @testing-library/react（现只有 api 包有测试基建），root `test` 脚本改为跑全部包。

## 迁移范围

全部约 20 个手写遮罩弹窗迁移到壳组件（components/、components/suppliers/、pages/products/、pages/label-trend/、pages/transactions/ 等），纯机械替换：删手写遮罩与各自的 scroll-lock useEffect，套壳。表单类弹窗（TransactionModal、SupplierForm、ProductFormModal 等）加 `disableClose`。
