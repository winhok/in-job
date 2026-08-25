# 生产部署

## 前置配置

1. 复制根目录 `.env.example` 为 `.env`，填写 Mongo 管理账号、带认证参数的 `MONGODB_URI`、Grafana 管理员密码和 `ALERT_RELAY_TOKEN`。
2. 复制 `server/.env.example` 为 `server/.env.production`，填写生产 JWT、CORS 白名单、模型、embedding、Qdrant 与告警配置；只填写实际启用的支付或 OSS 配置组。根目录与服务端的 `ALERT_RELAY_TOKEN` 必须相同。
3. 复制 `apps/web/.env.example` 到部署平台的环境变量，设置 API 地址和 OSS 公共 region/bucket。
4. 不提交 `.env`、`.env.production`、私钥、商户证书或真实域名。

## Docker Compose

```bash
docker compose config
docker compose build
docker compose up -d
```

本地入口为 `http://localhost:8080`，Qdrant 为 Compose 内网服务，Prometheus 为 `http://localhost:9090`，Grafana 为 `http://localhost:3001`。缺少 Mongo 凭据、认证 URI、Grafana 密码或告警中继令牌时 Compose 会拒绝启动。

向量 RAG 启用时，生产环境必须配置 `QDRANT_URL`，以及 `EMBEDDING_API_KEY` 或 `OPENAI_API_KEY`。collection 首次使用时自动按配置维度和 Cosine 距离创建；已有 collection 维度不匹配会拒绝就绪。

## PM2

先执行 `pnpm install --frozen-lockfile && pnpm build`，再运行：

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
```

## Nginx 与 HTTPS

- `deploy/nginx/local.conf` 用于容器内 HTTP 反向代理。
- `deploy/nginx/in-job.conf` 是生产 HTTPS 模板。替换示例域名和证书路径后先执行 `nginx -t`，再 reload。
- `/api/` 关闭代理缓冲并延长读取超时，以支持 SSE 面试流。

## 健康与监控

- `GET /health/live`：进程存活。
- `GET /health/ready`：MongoDB 已连接；启用向量 RAG 时同时检查 Qdrant。
- `GET /metrics`：Prometheus 指标；生产环境应由网关限制为监控网络可访问。
- Grafana 会从 `deploy/monitoring/grafana/provisioning/alerting/dingtalk.yml` 注册钉钉告警中继。服务端需配置 `DINGTALK_WEBHOOK_URL`、`DINGTALK_SECRET` 和 `ALERT_RELAY_TOKEN`；仓库不保存真实 token。

本地构建、配置检查和模拟 Provider 不能证明真实支付宝、微信支付、OSS、embedding/Qdrant、模型、钉钉通知或生产 TLS 已联调。
