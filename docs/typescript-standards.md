# TypeScript 编码规范

## 类型断言 & 忽略

### 禁止 `as` 类型断言

`as` 绕过类型检查，掩盖真实问题。

```tsx
// bad
const data = res.json() as { token: string }
const el = event.target as HTMLInputElement

// good — 用泛型约束
const data: { token: string } = await res.json()
// 或类型守卫
function isLoginResponse(v: unknown): v is { token: string } {
  return typeof v === 'object' && v !== null && 'token' in v
}
```

例外：仅允许 `as const`（这是值推断，不是类型绕过）。

### 禁止 `@ts-ignore`、`@ts-expect-error`、`any`

遇到类型错误，修复类型定义而不是绕过检查。

```tsx
// bad
// @ts-ignore
someUnsafeCall()
const data: any = res.json()

// good — 定义精确类型或用 unknown + 缩窄
const data: unknown = res.json()
if (typeof data === 'object' && data !== null && 'token' in data) {
  console.log((data as { token: string }).token) // 此处 as 是守卫后的安全断言，唯一允许场景
}
```

## 严格模式

所有 `tsconfig.json` 必须开启：

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

这会启用 `strictNullChecks`、`noImplicitAny`、`strictFunctionTypes` 等全部严格检查。

## 常用模式

### 用 `const` 对象代替 enum

```tsx
// bad
enum Status { Active, Inactive }

// good
const STATUS = { Active: 'active', Inactive: 'inactive' } as const
type Status = typeof STATUS[keyof typeof STATUS]
```

### 用 `satisfies` 校验类型而不拓宽

```tsx
// bad — 类型被拓宽为 { color: string }
const config = { color: 'red' }

// good — 值保留字面量类型，同时校验结构
const config = { color: 'red' } satisfies { color: string }
```

### 用类型守卫缩窄 `unknown`

API 返回值应视为 `unknown`，用类型守卫安全缩窄：

```tsx
function hasProp<K extends string>(v: unknown, key: K): v is Record<K, unknown> {
  return typeof v === 'object' && v !== null && key in v
}

// 使用
const res: unknown = await fetchData()
if (hasProp(res, 'token') && typeof res.token === 'string') {
  // res.token 安全使用
}
```

### 优先用 `interface` 定义对象结构，用 `type` 定义联合/交叉

```tsx
interface User {
  id: string
  name: string
}

type Result = Success | Error
type EventMap = { click: void; change: string }
```

### 用 `Record<string, unknown>` 代替 `{ [key: string]: any }`

```tsx
// bad
function parse(input: { [key: string]: any }) {}

// good
function parse(input: Record<string, unknown>) {}
```

## 代码质量

### 消除未使用的变量和导入

`noUnusedLocals` 和 `noUnusedParameters` 必须开启。未使用的导入直接删除。

### 函数返回值必须标注类型

导出函数和复杂内部函数应显式声明返回类型，避免实现细节泄露到类型层面。

```tsx
// bad
export function getUser(id: string) {
  return db.query('SELECT * FROM users WHERE id = ?', [id])
}

// good
export function getUser(id: string): Promise<User | null> {
  return db.query('SELECT * FROM users WHERE id = ?', [id])
}
```
