# 组件封装原则

## 核心规则：数据与交互逻辑内聚

组件应将自身相关的数据获取、状态管理、交互逻辑封装在内部，让调用方以最低成本使用。

### 判断标准

如果一个组件只负责**展示**数据（如纯列表、卡片），props 传数据进来是合理的。
但如果一个组件包含**弹窗、请求、loading 状态**等交互逻辑，这些逻辑应该内聚在组件内部。

### 反面示例

调用方需要管理 `products`、`loading`、API 调用函数：

```tsx
// 调用方 —— 职责过重
const [modal, setModal] = useState<{ visitor: Visitor | null; products: Product[]; loading: boolean }>({ visitor: null, products: [], loading: false })

async function showModal(visitor: Visitor) {
  setModal({ visitor, products: [], loading: true })
  try {
    const products = await api.getVisitorProducts(visitor.id)
    setModal({ visitor, products, loading: false })
  } catch {
    setModal({ visitor, products: [], loading: false })
  }
}

<SomeModal visitor={modal.visitor} products={modal.products} loading={modal.loading} onClose={() => setModal({ visitor: null, products: [], loading: false })} />
```

### 正面示例

组件内部管理数据和交互，调用方只需传一个触发值：

```tsx
// 调用方 —— 只关心"给谁"和"关掉"
const [modal, setModal] = useState<{ visitor: Visitor | null }>({ visitor: null })

<SomeModal visitor={modal.visitor} onClose={() => setModal({ visitor: null })} />
```

### 实践要点

1. **props 最小化**：只传组件需要的最小信息（如一个 ID 或对象），不传 `loading`、`data` 等内部状态
2. **API 调用在组件内**：用 `useEffect` 监听触发条件，组件自己请求数据
3. **状态在组件内**：`loading`、`error`、列表数据等由组件自己管理
4. **调用方只做两件事**：决定传什么触发值、决定怎么关掉
