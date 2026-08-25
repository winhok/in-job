import { RunnableLambda } from '@langchain/core/runnables';
import { describe, expect, it, vi } from 'vitest';
import { SessionManager } from './session.manager';

describe('SessionManager', () => {
  function createManager(handler: () => unknown) {
    const model = RunnableLambda.from(() => Promise.resolve(handler()));
    return new SessionManager(
      { createStableModel: vi.fn(() => model) } as never,
      {
        get: vi.fn((key: string) =>
          key === 'AI_CONVERSATION_SUMMARY_THRESHOLD' ? '12' : undefined,
        ),
      } as never,
    );
  }

  it('达到阈值后保留 system、摘要和最近消息', async () => {
    const manager = createManager(() => ({
      content: '候选人关注 Vue 性能优化。',
    }));
    const sessionId = manager.createSession('user-1', '前端', '系统指令');
    for (let index = 0; index < 12; index += 1) {
      manager.addMessage(
        sessionId,
        index % 2 === 0 ? 'user' : 'assistant',
        `消息 ${index}`,
      );
    }

    await manager.summarizeLongConversation(sessionId);
    const history = manager.getHistory(sessionId);
    expect(history).toHaveLength(8);
    expect(history[0]).toEqual({ role: 'system', content: '系统指令' });
    expect(history[1].content).toContain('之前对话摘要');
    expect(history.at(-1)?.content).toBe('消息 11');
  });

  it('摘要模型失败时保留原历史并允许最近窗口降级', async () => {
    const manager = createManager(() => {
      throw new Error('model unavailable');
    });
    const sessionId = manager.createSession('user-1', '前端', '系统指令');
    for (let index = 0; index < 12; index += 1) {
      manager.addMessage(sessionId, 'user', `消息 ${index}`);
    }
    await expect(
      manager.summarizeLongConversation(sessionId),
    ).resolves.toBeUndefined();
    expect(manager.getHistory(sessionId)).toHaveLength(13);
    expect(manager.getRecentMessages(sessionId, 4)).toHaveLength(5);
  });

  it('清理超过一小时未活动的内存会话', () => {
    const manager = createManager(() => ({ content: '' }));
    const sessionId = manager.createSession('user-1', '前端', '系统指令');
    manager.getSession(sessionId)!.lastActivityAt = new Date(
      Date.now() - 3_700_000,
    );
    manager.cleanupExpiredSessions();
    expect(manager.getSession(sessionId)).toBeUndefined();
  });
});
