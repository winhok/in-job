# 高级 AI 平台能力

## 问题

v0.4.0 已完成主要产品闭环，但七项高级能力仍不完整：AI 结果没有通用持久缓存；批处理与热门岗位预计算没有服务端任务模型；RAG 仍是关键词检索；失败报告没有后台自动重试；告警没有真实钉钉通知链路；UI、Prompt 和报告没有完整中英双语契约。

## 范围

- 实现用户隔离、模型/版本感知、TTL 控制、并发去重的 MongoDB AI 结果缓存。
- 实现可复用的有界并发批处理执行器、持久化 AI 批任务和热门岗位问题预计算。
- 使用 OpenAI-compatible embeddings 与 Qdrant 完成向量化索引、用户过滤和语义检索，文本检索只作为故障降级。
- 为失败或遗留 generating 的评估报告增加后台定时扫描、原子认领、指数退避、最大重试次数和恢复记录。
- 实现经内部共享令牌保护的 Grafana webhook 到钉钉机器人签名转发链路，并配置 Grafana contact point/policy。
- 实现 `zh-CN` 与 `en-US` 的完整 UI、Prompt、报告字段和日期/SEO 语言切换，并增加硬编码中文覆盖审计。
- 增加缓存、批处理、预计算、向量隔离、自动重试、钉钉签名和 i18n 的自动化验证。

## 非目标

- 不提交 OpenAI、Qdrant、钉钉或 Grafana 真实凭据。
- 不在本地验证中调用真实模型、钉钉机器人或生产 Qdrant。
- 不把其他独立产品扩展为当前 AI 面试产品模块。
- 不把缓存命中、mock client 或构建通过误报为真实外部服务验收。

## 受影响契约

- AI 调用增加 `cacheScope`、locale、模型和 prompt 版本参与的缓存键；不同用户的个性化结果不得共享。
- 新增管理员批任务、热门岗位和预计算管理接口，以及受控的预计算题库读取接口。
- Qdrant payload 必须包含 owner、source、locale 和内容版本；检索过滤必须绑定当前用户或明确公共题库。
- 报告结果保存生成 locale；同一报告的后台与手动重试共享同一原子状态机。
- Grafana 只调用内网告警转发端点；转发端点要求常量时间比较的共享令牌。
- 前端通过 locale 路由/状态和 `Accept-Language` 传递语言；服务端只接受 `zh-CN` 或 `en-US`。

## 风险

- 缓存键遗漏用户、模型或 prompt 版本会造成数据串用或陈旧结果。
- 批任务和定时重试在多实例下可能重复执行，必须以 MongoDB 原子认领和租约控制。
- embedding 维度与 Qdrant collection 不一致会导致索引失败；启动时必须校验 collection。
- 向量 payload 或日志可能泄露简历正文；Qdrant 只存所需片段，日志不得记录正文或向量。
- UI 文本数量较多，必须用自动审计防止新硬编码文本回退为单语。
- 钉钉签名时间窗口、webhook token 和内部共享令牌均属敏感配置。

## 验收标准

- 同一用户相同 AI 请求命中缓存，不同用户、模型、locale 或 prompt 版本不会命中同一记录；失败不缓存。
- 批任务有 queued/running/completed/partial/failed/cancelled 状态，单项失败不丢失其他结果；多实例只认领一次。
- 热门岗位可登记、定时发现过期项并批量生成中英问题集，读取接口返回最新已发布版本。
- RAG 索引调用 embeddings 并写入 Qdrant；查询调用 query embedding、owner 过滤和余弦检索，故障时返回文本降级结果。
- 报告自动重试遵守次数和 nextRetryAt，恢复过期 generating，成功后清除重试状态。
- Grafana provisioning 存在钉钉 contact point；转发服务验证令牌并生成钉钉签名请求。
- 两种 locale 的页面核心和辅助 UI、Prompt、报告、SEO 与日期可切换，i18n 审计无未登记用户可见硬编码中文。
- 全量 lint、测试、构建、E2E、Docker/Compose、API、能力契约和 DeliveryGuard 检查通过。
