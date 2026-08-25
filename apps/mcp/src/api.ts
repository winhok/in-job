import axios, { type AxiosInstance } from 'axios';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface McpApiConfig {
  baseURL: string;
  token: string;
}

export class McpApiClient {
  private readonly http: AxiosInstance;

  constructor(config: McpApiConfig) {
    const baseURL = new URL(config.baseURL);
    if (!['http:', 'https:'].includes(baseURL.protocol)) {
      throw new Error('IN_JOB_API_BASE_URL 只允许 http 或 https');
    }
    if (!config.token.trim()) throw new Error('缺少 IN_JOB_JWT_TOKEN');
    this.http = axios.create({
      baseURL: baseURL.toString(),
      timeout: 30_000,
      headers: { Authorization: `Bearer ${config.token}` },
    });
  }

  getCurrentUserInfo() {
    return this.get<Record<string, unknown>>('/user/info');
  }

  getUserConsumptionRecords() {
    return this.get<Record<string, unknown>>('/user/consumption-records');
  }

  getResumeQuizHistory(page: number, limit: number) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return this.get<Record<string, unknown>>(
      `/interview/resume/quiz/history?${query.toString()}`,
    );
  }

  getResumeQuizResultDetail(resultId: string) {
    return this.get<Record<string, unknown>>(
      `/interview/resume/quiz/result/${encodeURIComponent(resultId)}`,
    );
  }

  getAnalysisReport(resultId: string) {
    return this.get<Record<string, unknown>>(
      `/interview/analysis/report/${encodeURIComponent(resultId)}`,
    );
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.http.get<ApiResponse<T>>(path);
    if (response.data.code >= 400) {
      throw new Error(response.data.message || '接口调用失败');
    }
    return response.data.data;
  }
}

export function loadMcpApiConfig(
  env: NodeJS.ProcessEnv = process.env,
): McpApiConfig {
  return {
    baseURL: env.IN_JOB_API_BASE_URL || 'http://127.0.0.1:3000',
    token: env.IN_JOB_JWT_TOKEN || '',
  };
}
