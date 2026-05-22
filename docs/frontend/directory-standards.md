# 目录与组件组织规范

## 核心原则：就近放置，按需提升

代码放在离使用它最近的地方。只有被多处使用时，才提升到更高层级的共享目录。

## 页面目录结构

每个页面一个独立文件夹，页面自身的组件、hooks、工具函数等全部放在该文件夹内：

```
src/
├── components/          # 全局共享组件（被 2+ 页面使用）
├── lib/                 # 全局共享工具（被 2+ 页面使用）
├── hooks/               # 全局共享 hooks（被 2+ 页面使用）
├── pages/
│   ├── home/
│   │   ├── index.tsx            # 路由入口，导出页面组件
│   │   ├── HomePage.tsx         # 页面主组件
│   │   ├── components/          # 仅本页面使用的子组件
│   │   │   ├── StatsCard.tsx
│   │   │   └── TrendChart.tsx
│   │   └── hooks/               # 仅本页面使用的 hooks
│   │       └── useHomeData.ts
│   └── example/
│       ├── index.tsx
│       ├── ExamplePage.tsx
│       └── components/
│           └── ExampleTable.tsx
```

### 文件职责

| 文件 | 职责 |
|------|------|
| `index.tsx` | 路由入口，只做导出 |
| `*Page.tsx` | 页面主组件，负责布局和组合子组件 |
| `components/` | 仅被本页面使用的展示/交互组件 |
| `hooks/` | 仅被本页面使用的自定义 hooks |

## 组件归属规则

### 只被一个页面使用 → 放在页面目录内

```tsx
// pages/home/components/StatsCard.tsx  ✅
// 仅 home 页面用到，就近放置
```

### 被 2+ 页面使用 → 提升到全局目录

```tsx
// components/ProductDetailDrawer.tsx  ✅
// 多个页面都用到了，提升到全局
```

### 判断流程

```
新建一个组件
  ↓
只被当前页面使用？ ──是──→ 放在 pages/{page}/components/
  ↓否
被 2+ 页面使用？ ──是──→ 放在 src/components/
  ↓否（暂时只有一处但预期会复用）
还是放在页面内，等真正复用时再提升
```

## 不要提前抽象

- 两个组件看起来相似，但只各用一处 → **不要抽共享组件**，各自实现
- 一个 hook 目前只用了一次，但"以后可能会用" → **放在页面内**，用到时再提升
- 为了"代码复用"创建了只有一处调用的工具函数 → **不要抽**，写在调用处旁边

**提升的时机是实际复用发生时，不是预期复用时。**

## 路由入口约定

`index.tsx` 只负责导出，不包含逻辑：

```tsx
// pages/home/index.tsx
export { default } from './HomePage'
```

如果页面需要 lazy loading，在这里处理：

```tsx
// pages/home/index.tsx
import { lazy } from 'react'
export default lazy(() => import('./HomePage'))
```
