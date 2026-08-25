# MCP Server

`apps/mcp` 提供 5 个只读工具：用户信息、消费记录、押题历史、押题详情和分析报告。

## 构建

```bash
pnpm --filter @in-job/mcp build
```

## 配置

MCP 进程需要调用某个用户的受保护 API，因此令牌必须由启动它的用户在本地环境提供，不能提交到仓库：

```text
IN_JOB_API_BASE_URL=http://127.0.0.1:3000
IN_JOB_JWT_TOKEN=<user-scoped-jwt>
```

MCP 客户端的 stdio 启动命令指向：

```text
node <repository>/apps/mcp/build/index.js
```

JWT 会作为子进程环境变量传入，不要写进客户端可同步或可提交的公共配置。MCP 只暴露读取工具，不提供支付、兑换、修改资料或管理员操作。
