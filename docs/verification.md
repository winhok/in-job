# v0.4.0 本地验证记录

## 已通过

- `pnpm --filter @in-job/server exec eslint "{src,test}/**/*.ts"`
- `pnpm test`：服务端 30 个测试文件、79 项测试通过；MCP 2 项测试通过。
- `pnpm build`：NestJS、Nuxt 与 MCP 生产构建通过。
- `pnpm --filter @in-job/server test:e2e`：1 项 MongoDB E2E 通过。
- `pnpm audit:api`：前端 32 个 API 契约，未登记缺口为 0。
- `pnpm audit:capabilities`：23 个关键路由、5 个 MCP 工具、12 个基础指标和规范字段全部满足最低能力契约。
- `pnpm verify:delivery-assets`：部署资产及关键入口通过静态校验。
- `docker compose config --quiet`：Compose 配置通过。
- 两个 Dockerfile 的 `docker build --check` 均通过且无警告。
- 后端 `pnpm deploy --legacy --prod` 成功；临时生产依赖集包含 Nest runtime，且不含 ESLint/Vitest。
- Grafana dashboard JSON 解析通过。
- `git diff --check` 与敏感信息模式扫描通过。
- `deliveryguard check` 通过。

## 仍需外部验收

- Dockerfile 静态检查和生产依赖裁剪已通过，但没有执行完整镜像构建与容器启动。
- 真实支付宝、微信支付、微信服务号、OSS STS、DeepSeek/OpenAI、Prometheus 抓取、Grafana 通知、Nginx TLS 和生产部署均未执行。
- 本地单元测试、构建和静态配置检查不是正式验收或生产发布证据。

# v0.5.0 高级扩展本地验证记录

## 已通过

- 服务端 ESLint 通过。
- `pnpm test`：服务端 36 个测试文件、103 项测试通过；MCP 2 项测试通过。
- `pnpm build`：NestJS、Nuxt 和 MCP 生产构建通过；Nuxt 同时生成中英文 locale 资源。
- `pnpm --filter @in-job/server test:e2e`：1 项完整应用 E2E 通过，后台调度器关闭时无竞态错误。
- `pnpm audit:i18n`：659 个中英文消息叶子键同步，生产 Vue 模板无未登记中文硬编码。
- `pnpm audit:api`：前端 32 个 API 契约，后端 57 个路由，登记缺口 0。
- `pnpm audit:capabilities`：23 个关键路由、5 个 MCP 工具、12 个基础指标和规范字段满足最低能力契约；当前分别为 57、5、20。
- `pnpm verify:delivery-assets`：19 项部署资产通过。
- `docker compose config --quiet`：MongoDB、Qdrant、服务端、前端、Prometheus 与 Grafana 配置可解析。
- 服务端和前端 Dockerfile 的 `docker build --check` 均通过且无警告。
- Grafana 钉钉 contact point/policy provisioning YAML 可解析。
- 服务端生产 `pnpm deploy --legacy --prod` 成功，生产依赖包含 `@qdrant/js-client-rest` 且不包含 ESLint/Vitest。
- DeliveryGuard 检查通过；v0.5.0 当前为 `specified`，因为工作树尚未形成源提交，不能误报为 `implemented`。

## 外部验收边界

- 未下载并启动 Qdrant/Grafana 镜像，因此没有真实 collection、embedding 请求或 Grafana 通知运行证据；本机不存在相应镜像，且本次没有获得安装镜像的授权。
- 未向真实钉钉机器人发送消息，未调用真实模型生成中英文报告。
- 尝试通过应用内浏览器做桌面/移动视觉验收，但浏览器隔离环境无法连接宿主机 `127.0.0.1:8081`；生产构建与 i18n 静态审计通过，但真实浏览器视觉和交互仍需人工环境验收。
- 未执行生产发布、外部配置写入、Git commit 或 push。
