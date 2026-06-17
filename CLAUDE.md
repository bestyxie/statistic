# Project Instructions

项目约定文档统一放在 `docs/` 目录下，开发时务必遵循：

- [组件封装原则](docs/frontend/component-principles.md) — 数据与交互逻辑内聚，调用方只传触发值和关闭回调
- [TypeScript 编码规范](docs/frontend/typescript-standards.md) — 禁止 as/any/ts-ignore，严格模式，常用模式
- [目录与组件组织规范](docs/frontend/directory-standards.md) — 页面独立文件夹，就近放置，按需提升，不提前抽象
- [测试规范](docs/testing-standards.md) — 覆盖率 100%，测试文件同级 `__tests__/`，用例独立不共享状态
