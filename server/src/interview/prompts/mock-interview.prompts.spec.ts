import { describe, expect, it } from 'vitest';
import { buildMockInterviewPrompt } from './mock-interview.prompts';

describe('buildMockInterviewPrompt', () => {
  it('专项面试包含技术策略、模板变量和标准答案协议', () => {
    const prompt = buildMockInterviewPrompt({
      interviewType: 'special',
      elapsedMinutes: 10,
      targetDuration: 60,
    });

    expect(prompt).toContain('专项面试（技术深度为主）');
    expect(prompt).toContain('{resumeContent}');
    expect(prompt).toContain('{conversationHistory}');
    expect(prompt).toContain('[STANDARD_ANSWER]');
    expect(prompt).not.toContain('接近目标时长60分钟');
  });

  it('达到目标时长的80%后提示模型准备结束', () => {
    const prompt = buildMockInterviewPrompt({
      interviewType: 'comprehensive',
      elapsedMinutes: 36,
      targetDuration: 45,
    });

    expect(prompt).toContain('综合面试（行测题 + HR面试）');
    expect(prompt).toContain('接近目标时长45分钟');
    expect(prompt).toContain('[END_INTERVIEW]');
  });
});
