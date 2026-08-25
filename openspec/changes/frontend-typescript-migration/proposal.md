# 前端 TypeScript 迁移与废弃 API 清理

## 问题

当前 Nuxt 前端仍以 JavaScript 和未声明语言的 Vue 脚本为主，缺少可重复的前端类型检查；同时存在 Nuxt 兼容别名、浏览器废弃复制 API 和 ESLint 配置废弃辅助函数。这些调用在当前版本仍可运行，但会增加未来升级风险，并使接口、状态和组件交互的数据形状缺少静态约束。

## 范围

- 将 `apps/web` 内业务 JavaScript、Nuxt 配置和 Vue 脚本迁移为 TypeScript。
- 增加仓库可重复执行的前端类型检查命令和必要的 TypeScript 开发依赖。
- 为 API 响应、Pinia 状态、组件属性、模板引用、计时器和浏览器能力补充类型。
- 将 `process.client`、`process.dev`、`document.execCommand` 和 `tseslint.config()` 替换为当前依赖推荐的 API。
- 保持现有页面模板、事件绑定、请求顺序、状态变更、导航和用户提示流程不变。

## 非目标

- 不重设计页面、调整样式、文案、路由或产品交互。
- 不修改后端接口、请求路径、请求载荷或响应业务语义。
- 不借迁移重构业务流程、改变组件职责或引入新的状态管理方案。
- 不执行生产部署，也不把本地类型检查和构建视为正式验收或发布证据。

## 受影响契约

- `@in-job/web` 新增前端 `typecheck` 脚本及显式 TypeScript 工具依赖。
- JavaScript 模块扩展名迁移为 `.ts`；现有无扩展名导入继续由 Nuxt/Vite 解析。
- Vue `<script setup>` 或 `<script>` 增加 `lang="ts"`，模板和公开属性/事件名称保持不变。
- 客户端和开发环境判断改为 `import.meta.client`、`import.meta.dev`。
- 剪贴板复制仍先调用 `navigator.clipboard.writeText()`；失败时进入原有失败提示路径，不再调用废弃的 `document.execCommand()`。

## 风险

- Vue 模板引用、DOM ref、第三方组件和 API 响应类型不准确可能造成编译通过但运行期行为偏差。
- 批量扩展名迁移可能遗漏显式 `.js` 导入、配置入口或构建脚本引用。
- 为消除类型错误而增加默认值、分支或类型断言可能意外改变交互逻辑，必须通过差异审查限制为类型层变更。
- Clipboard API 在非安全上下文不可用；移除废弃回退后必须保留明确的手动复制失败提示。

## 验收标准

- `apps/web` 的一方 JavaScript 业务与配置文件均迁移为 TypeScript，Vue 脚本均显式使用 TypeScript。
- 全仓类型感知弃用扫描不再命中上述 4 类 API。
- 前端类型检查和生产构建通过。
- 显式 `.js` 路径、遗留无类型 Vue 脚本和临时迁移文件均不存在。
- 差异审查确认模板、事件、请求和状态交互未被有意改变。
