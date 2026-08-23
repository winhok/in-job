# 简历智能押题技术设计

## 处理链路

1. Controller 校验 JWT，并建立 SSE 响应。
2. InterviewService 校验幂等记录和用户剩余额度。
3. DocumentParserService 下载并解析 PDF 或 DOCX 内容。
4. InterviewAIService 分阶段生成题目和分析，并解析结构化输出。
5. InterviewService 保存押题结果和消费状态，随后发送完成事件。
6. 任一步骤失败时记录失败状态；已扣费请求尝试退款并发送错误事件。

## 一致性边界

- `userId + requestId` 用于约束同一用户的重复请求。
- 消费记录区分 pending、success 和 failed，避免把处理中请求当作成功结果复用。
- 押题结果独立持久化，消费记录只保存计费和请求追踪事实。
- 客户端连接关闭时取消 Observable 订阅，停止后续事件写入。

## 验证边界

- 单元测试覆盖成功、重复请求和 AI 失败退款路径。
- 工作区测试与生产构建用于验证代码结构和打包结果。
- 正式验收、真实外部文档、真实模型调用和生产部署仍需独立证据。
