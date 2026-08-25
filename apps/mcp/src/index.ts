import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadMcpApiConfig, McpApiClient } from './api.js';

const api = new McpApiClient(loadMcpApiConfig());
const server = new McpServer({ name: 'in-job-mcp', version: '1.0.0' });

const textResult = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});

server.registerTool(
  'get_current_user_info',
  { description: '获取当前登录用户的信息', inputSchema: {} },
  async () => textResult(await api.getCurrentUserInfo()),
);

server.registerTool(
  'get_user_consumption_records',
  { description: '获取当前用户的消费记录', inputSchema: {} },
  async () => textResult(await api.getUserConsumptionRecords()),
);

server.registerTool(
  'get_resume_quiz_history',
  {
    description: '分页获取当前用户的简历押题历史记录',
    inputSchema: {
      page: z.number().int().positive().default(1).describe('页码'),
      limit: z
        .number()
        .int()
        .positive()
        .max(20)
        .default(10)
        .describe('每页条数，最大 20'),
    },
  },
  async ({ page = 1, limit = 10 }) =>
    textResult(await api.getResumeQuizHistory(page, limit)),
);

server.registerTool(
  'get_resume_quiz_result_detail',
  {
    description: '根据 resultId 获取某次简历押题的结果详情',
    inputSchema: { resultId: z.string().min(1).max(200) },
  },
  async ({ resultId }) =>
    textResult(await api.getResumeQuizResultDetail(resultId)),
);

server.registerTool(
  'get_analysis_report',
  {
    description: '根据 resultId 获取分析报告',
    inputSchema: { resultId: z.string().min(1).max(200) },
  },
  async ({ resultId }) => textResult(await api.getAnalysisReport(resultId)),
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  console.error('in-job MCP server running on stdio');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(`MCP startup failed: ${message}`);
  process.exitCode = 1;
});
