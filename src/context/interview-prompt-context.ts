/**
 * 模拟面试官 Prompt 上下文。
 *
 * 只包含「一场面试内稳定」的字段 —— 它们在整场面试中不变,
 * 因此由这些字段拼出的 system prompt 逐轮字节一致,可命中隐式 Prompt Cache。
 *
 * ⚠️ 每轮变化的信息(已用时长、对话历史)不放这里:
 *   - elapsedMinutes / 结束提示 → 走 buildTurnContext(),注入当轮用户消息
 *   - conversationHistory      → 走 messages 数组,不进 system prompt
 * 放进来会逐轮改变前缀字节,导致缓存全部失效。
 */
export interface InterviewPromptContext {
  /** 面试类型:专项(技术深度) | 综合(行测 + HR)。值与 AIInterviewType 对齐。 */
  interviewType: 'special' | 'behavior';

  /** 目标公司(可选) */
  company?: string;

  /** 目标岗位名称(可选) */
  positionName?: string;

  /** 职位描述 JD(可选) */
  jd?: string;

  /** 薪资范围,如 "20-35K"(可选) */
  salaryRange?: string;

  /** 候选人简历全文 */
  resumeContent: string;

  /** 目标面试时长(分钟)。一场面试内不变,故放这里;elapsedMinutes 不放。 */
  targetDuration: number;
}
