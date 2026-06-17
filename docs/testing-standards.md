# 测试规范

## 测试范围

以下内容**必须**编写测试：

- 所有 API endpoint（routes）
- 所有 utils / lib 工具函数
- 纯逻辑的自定义 hooks（不含 UI 渲染的）

以下内容**不要求**测试：

- 纯 UI 展示组件的渲染快照（价值低，维护成本高）
- 框架胶水代码（路由配置、入口文件）

## 测试覆盖率

所有函数和 class 的行覆盖率与分支覆盖率要达 **100%**。

如果某个分支在现实中不可能触发（如类型守卫的兜底），用注释说明原因：

```ts
// unreachable: TS guarantees status is one of the union members
// istanbul ignore next
```

## 文件组织

测试文件放在被测文件的**同级** `__tests__/` 目录下：

```
src/
├── lib/
│   ├── format.ts
│   └── __tests__/
│       └── format.unit.test.ts
├── hooks/
│   ├── useFilter.ts
│   └── __tests__/
│       └── useFilter.unit.test.ts
├── routes/
│   ├── products.ts
│   └── __tests__/
│       └── products.integration.test.ts
```

### 命名规则

`<源文件名>.<类别>.test.ts`

- 类别为 `unit` 或 `integration`
- unit：单个函数 / hook，无外部依赖或 mock 替代
- integration：涉及数据库、API、文件系统等真实外部依赖

## 测试独立性

- 每个测试用例之间**不共享状态**，不依赖执行顺序
- 每个用例自行准备数据、自行清理
- 使用 `beforeEach` 重置状态，而非假设上一个用例的副作用

```ts
// ✅ 每个用例自包含
describe('formatDate', () => {
  it('formats ISO string', () => {
    expect(formatDate('2024-01-01')).toBe('2024-01-01')
  })

  it('handles empty input', () => {
    expect(formatDate('')).toBe('')
  })
})

// ❌ 用例之间有依赖
describe('counter', () => {
  let count: number // 共享状态
  beforeEach(() => { count = 0 })

  it('increments', () => { count++ })
  it('check result', () => { expect(count).toBe(1) }) // 依赖上一个用例
})
```

## 编写要求

### 一个用例测一件事

```ts
// ✅
it('returns null for empty input')
it('returns null for whitespace-only input')

// ❌
it('handles edge cases', () => {
  expect(fn('')).toBeNull()
  expect(fn('  ')).toBeNull()
  expect(fn(null)).toBeNull()
})
```

### 测试行为，不测实现

```ts
// ✅ 测输出
expect(parseQuery('?a=1&b=2')).toEqual({ a: '1', b: '2' })

// ❌ 测内部实现
expect(result._internalMap.size).toBe(2)
```

### 用描述性的 test name

用例名应能独立表达意图，读 test name 就知道测了什么、期望什么：

```ts
// ✅
it('throws when price is negative')
it('returns empty array when no results found')

// ❌
it('works')
it('test1')
it('error handling')
```

### 避免过度 mock

- mock 外部边界（API、数据库），不 mock 被测模块的内部函数
- 如果一个测试需要 mock 大量内部函数，说明被测代码职责过多，应先拆分

## 异步测试

- 异步用例使用 `async/await`，不用 `done` 回调
- 测试超时根据实际情况设置，默认即可

```ts
it('fetches products from API', async () => {
  const result = await getProducts()
  expect(result).toHaveLength(3)
})
```

## 错误路径

正常路径和错误路径都要覆盖：

```ts
describe('createUser', () => {
  it('creates user with valid input', async () => { /* ... */ })
  it('throws on duplicate email', async () => {
    await expect(createUser({ email: 'dup@test.com' }))
      .rejects.toThrow('Email already exists')
  })
  it('throws on invalid email format', async () => { /* ... */ })
})
```
