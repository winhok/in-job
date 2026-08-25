# 产品能力覆盖清单

本清单用于记录产品需求、运行能力与仓库实现之间的映射。概念验证代码和无业务用途的演示模块不纳入生产产品范围。

| 能力域 | 仓库实现 | 状态 |
| --- | --- | --- |
| 应用基础：模块、Swagger、JWT、用户、配额、资料 | `app.module.ts`、`main.ts`、`auth/`、`user/`、`resume/`、`sts/` | 已实现 |
| AI 基础：模型工厂、Prompt、会话、长对话、重试、超时、多模型 | `ai/`、`interview/prompts/`、`SessionManager`、`AIModelFactory` | 已实现 |
| AI 增强：RAG、流式响应、评估、Token 与成本监控 | `knowledge/`、模拟面试 SSE、异步评估、AI 指标 | 已实现 |
| 简历押题：幂等、扣费、退款、解析和生成 | `InterviewService`、`DocumentParserService`、相关 DTO、Schema 与测试 | 已实现 |
| 模拟面试：暂停、恢复、持久会话和报告状态机 | 模拟面试 SSE、会话快照、报告生成与重试 | 已实现 |
| 质量闭环：反馈、争议与人工复核 | `review/`、报告反馈 UI、管理员复核 API | 已实现 |
| 微信服务号登录与菜单 | `wechat/` 与登录页轮询 | 已实现；真实公众号联调待外部验收 |
| 支付与权益 | `payment/`、充值与兑换 UI、交易记录、测试 Provider | 已实现；真实商户联调待外部验收 |
| 结构化日志、TraceID 与敏感信息保护 | `common/logger`、`middleware`、`observability` | 已实现 |
| Prometheus、Grafana、业务和 AI 指标、告警 | `common/metrics`、`deploy/monitoring` | 已实现；真实抓取与通知待外部验收 |
| 环境校验、构建、PM2、Nginx、HTTPS 与容器 | 环境示例、Dockerfile、Compose、PM2、`deploy/nginx` | 已实现；完整环境启动待外部验收 |
| 安全与可靠性 | 限流、Helmet、生产 CORS、私有 OSS URL、支付验签 | 已实现 |
| MCP 只读查询 | `apps/mcp` 的 5 个工具 | 已实现 |
| 通用 AI 缓存 | `ai-cache/`，按用户、模型、locale 与 Prompt 版本隔离，支持 TTL 与并发合并 | 已实现 |
| AI 批处理与热门岗位预计算 | `batch/`、`precompute/`，持久任务、租约、取消、恢复、中英题库版本 | 已实现 |
| 向量化 RAG | `EmbeddingService`、`QdrantVectorStore`、Qdrant Compose，Mongo 文本作为故障降级 | 已实现；真实 embedding/Qdrant 待环境验收 |
| 报告自动重试 | `ReportRetryScheduler`，指数退避、最大次数、过期租约恢复与手动重试统一状态机 | 已实现 |
| 钉钉告警 | `alerts/` 与 Grafana provisioning，Bearer 中继鉴权和动态签名 | 已实现；真实机器人通知待外部验收 |
| 完整多语言 | Nuxt i18n、中英消息、双语岗位/FAQ/法律内容、Prompt 与报告 locale | 已实现；浏览器和真实模型效果待外部验收 |

自动检查入口：

- `pnpm audit:api`
- `pnpm audit:capabilities`
- `pnpm audit:i18n`
- `pnpm verify:delivery-assets`
- `pnpm test`
- `pnpm build`
- `pnpm deliveryguard:check`
