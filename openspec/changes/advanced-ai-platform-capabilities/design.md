# 高级 AI 平台能力技术设计

## AI 缓存

`AiResultCache` 使用 SHA-256 计算 `operation + scope + provider + model + locale + promptVersion + canonicalInput`。MongoDB 唯一索引防止重复写，TTL 索引负责过期；进程内只保存正在计算的 Promise 用于同进程并发合并。缓存值按用户 scope 保存，永不记录原始 prompt 到日志。

## 批处理与预计算

通用 `BoundedBatchRunner` 以固定 worker 数处理输入并返回逐项结果。持久 `AiBatchJob` 使用租约字段由 worker 原子认领，支持取消和过期租约恢复。首个业务 operation 是热门岗位问题预计算：管理员维护岗位，调度器按 `staleAt` 生成批任务，成功结果写入版本化题库后发布。

## 向量 RAG

MongoDB 保留 chunk 生命周期和来源事实；`EmbeddingService` 批量生成向量；`QdrantVectorStore` 创建 cosine collection、upsert 确定性 point ID，并以 owner/source/locale payload filter 查询。向量服务或 embedding 故障时，才执行现有 MongoDB `$text` 降级，并记录降级指标。

## 报告自动重试

`ReportRetryScheduler` 周期调用 `InterviewService.retryDueAssessmentReports`。失败记录保存 `reportAttempts`、`nextRetryAt`、`lastReportAttemptAt`；指数退避由配置控制。超过 generating 租约的记录先转 failed 再参与认领。手动重试将 nextRetryAt 设为当前时间，但不能越过最大次数限制，除非管理员显式重置。

## 钉钉告警

Grafana webhook 指向内网 `/internal/alerts/dingtalk`，通过 `Authorization: Bearer <internal token>` 验证。服务将 Grafana alerts 汇总为钉钉 markdown，按 `timestamp + secret` 计算 HMAC-SHA256 签名后发送。配置缺失或钉钉失败返回明确状态并记录低基数指标，不输出 webhook。

## 多语言

Nuxt i18n 使用 `zh-CN` 默认语言和 `en-US`，locale 文件懒加载。前端请求自动发送 `Accept-Language`。AI DTO 显式传 locale；Prompt builder 按 locale 选择指令和输出语言；报告持久化 `reportLocale`。枚举和数据库键保持语言无关，UI 只翻译展示文本。

## 验证边界

单元测试使用 fake Mongo model、embedding client、Qdrant client、模型和钉钉 HTTP；本地 Compose 可验证 Qdrant schema，但真实 embedding、真实钉钉、真实 Grafana 通知和多实例竞争仍需环境验收。
