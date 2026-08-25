# 技术设计

## 迁移策略

迁移按“配置与工具链、普通模块、Vue 脚本、类型收敛、验证”推进。普通 JavaScript 文件只改变扩展名并补充类型；Vue 文件保留 template/style 原文，只为脚本声明 TypeScript 并修复静态类型。无扩展名别名与相对导入保持不变，以避免改变运行时模块解析。

## 类型边界

- API 层定义通用响应、分页和各业务载荷类型，调用侧沿用现有解包语义。
- Pinia store 明确状态、getter 和 action 参数/返回值，组件继续通过现有 store API 交互。
- 组件 props、emits、template ref、浏览器事件和计时器使用 Vue、DOM 与运行时提供的类型。
- 对外部库缺失或不完整的声明采用最窄的本地接口或模块声明，不使用会吞掉整个应用错误的全局 `any`。

## 废弃 API 替换

- Nuxt 环境判断使用 `import.meta.client` 与 `import.meta.dev`。
- ESLint flat config 使用 `defineConfig()`。
- 复制功能保留标准 Clipboard API；失败时复用现有失败提示，不再创建临时 DOM 并调用 `execCommand()`。

## 行为保护

不改变 template、样式和用户可见成功路径。需要类型缩窄时优先使用类型声明、泛型、可选链和纯类型断言；若必须增加运行时保护，只允许避免原本会抛错的无效输入，且不得改变有效输入的结果或调用顺序。
