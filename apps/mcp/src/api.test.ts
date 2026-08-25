import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMcpApiConfig, McpApiClient } from './api.js';

test('MCP 配置使用当前后端默认端口', () => {
  assert.deepEqual(loadMcpApiConfig({ IN_JOB_JWT_TOKEN: 'token' }), {
    baseURL: 'http://127.0.0.1:3000',
    token: 'token',
  });
});

test('MCP 客户端拒绝缺失 token 和非 HTTP 协议', () => {
  assert.throws(
    () =>
      new McpApiClient({ baseURL: 'http://127.0.0.1:3000', token: '' }),
    /IN_JOB_JWT_TOKEN/,
  );
  assert.throws(
    () => new McpApiClient({ baseURL: 'file:///tmp/api', token: 'token' }),
    /http 或 https/,
  );
});
