import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOpenAI } from '@langchain/openai';
import { describe, expect, it, vi } from 'vitest';
import { AIModelFactory } from './ai-model.factory';

describe('AIModelFactory', () => {
  const createFactory = (values: Record<string, string>) =>
    new AIModelFactory({
      get: vi.fn((key: string) => values[key]),
    } as never);

  it('支持在 DeepSeek 和 OpenAI provider 之间切换', () => {
    expect(
      createFactory({
        AI_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'deepseek-key',
      }).createDefaultModel(),
    ).toBeInstanceOf(ChatDeepSeek);
    expect(
      createFactory({
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'openai-key',
      }).createDefaultModel(),
    ).toBeInstanceOf(ChatOpenAI);
  });

  it('拒绝未知 provider，而不是静默回退', () => {
    expect(() =>
      createFactory({ AI_PROVIDER: 'unknown' }).createDefaultModel(),
    ).toThrow('不支持的 AI_PROVIDER');
  });
});
