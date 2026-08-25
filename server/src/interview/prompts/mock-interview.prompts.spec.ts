import { describe, expect, it } from 'vitest';
import {
  buildAssessmentPrompt,
  buildMockInterviewPrompt,
} from './mock-interview.prompts';

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

  it('英文场次明确要求所有面向用户内容使用英文', () => {
    const prompt = buildMockInterviewPrompt({
      interviewType: 'special',
      elapsedMinutes: 5,
      targetDuration: 60,
      locale: 'en-US',
    });
    expect(prompt).toContain('natural professional English');
    expect(prompt).toContain('Keep control markers exactly as specified');
  });
});

describe('buildAssessmentPrompt', () => {
  it('专项面试使用技术能力评估维度', () => {
    const prompt = buildAssessmentPrompt({ interviewType: 'special' });
    expect(prompt).toContain('专项面试评估维度');
    expect(prompt).toContain('技术能力');
    expect(prompt).not.toContain('职业素养');
  });

  it('综合面试使用软技能评估维度', () => {
    const prompt = buildAssessmentPrompt({ interviewType: 'comprehensive' });
    expect(prompt).toContain('综合面试评估维度');
    expect(prompt).toContain('职业素养');
    expect(prompt).not.toContain('项目经验**');
  });

  it('英文报告要求翻译文本值但保留结构化枚举', () => {
    const prompt = buildAssessmentPrompt({
      interviewType: 'comprehensive',
      locale: 'en-US',
    });
    expect(prompt).toContain('professional English');
    expect(prompt).toContain(
      'Keep JSON keys and priority enum values unchanged',
    );
  });
});
