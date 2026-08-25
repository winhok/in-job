# 实施任务

## 1. 缓存

- [x] 定义 AI 缓存 Schema、规范化哈希、TTL、用户隔离和并发合并服务。
- [x] 将押题、分析、报告和预计算 AI 调用接入缓存并增加命中/隔离/失败测试。

## 2. 批处理与热门岗位预计算

- [x] 实现有界并发批处理执行器和逐项结果测试。
- [x] 实现持久批任务 Schema、租约认领、取消、恢复和管理 API。
- [x] 实现热门岗位登记、过期扫描、中英问题预计算、版本发布和读取 API。

## 3. 向量 RAG

- [x] 集成 embedding provider 与 Qdrant client/Compose，校验 collection 维度和 cosine 距离。
- [x] 实现用户隔离的向量 upsert/search、文本降级和相关测试。
- [x] 将模拟面试检索切换到向量主路径并记录向量/降级指标。

## 4. 报告自动重试

- [x] 扩展报告重试字段、指数退避和过期 generating 恢复。
- [x] 实现后台调度器、原子认领、最大次数和手动重试统一状态机测试。

## 5. 钉钉告警

- [x] 实现内部 webhook 鉴权、Grafana payload 转换、钉钉签名和发送服务。
- [x] 增加 Grafana contact point/policy provisioning、环境示例和签名/错误测试。

## 6. 完整多语言

- [x] 安装并配置 Nuxt i18n、locale 路由/持久化、语言切换和请求头。
- [x] 将页面、布局、组件、错误、SEO 和日期迁移到完整中英 locale 文件。
- [x] 为 DTO、Prompt、AI 输出与报告持久化增加 locale 契约。
- [x] 增加 i18n 硬编码审计、locale 完整性和中英文 Prompt/报告测试。

## 7. 总体验证

- [x] 更新能力覆盖、环境、部署和外部验收文档。
- [x] 运行 lint、全量测试、三包构建、E2E、API、能力契约、i18n 和部署资产审计。
- [x] 运行 Qdrant/Grafana/Compose/Docker 静态配置、敏感信息、DeliveryGuard 和 Git diff 检查；真实容器与外部通知保留为环境验收边界。
