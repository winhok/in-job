import { PromptBuilder } from './prompt-builder';
import type { InterviewPromptContext } from './interview-prompt-context';
import {
  identity,
  strategy,
  outputFormat,
  positionContext,
  resumeContext,
} from './pipes/interview.pipes';

/**
 * 构建模拟面试官的 system prompt。
 *
 * section 按「缓存稳定性从高到低」排列,使隐式 Prompt Cache 命中前缀最长:
 *   identity / strategy / outputFormat  —— 全局共享(仅随 interviewType 分变体)
 *   positionContext / resumeContext     —— 一场面试内稳定,换面试才变
 *
 * 一场面试内,本函数的输出逐轮字节一致 —— 每轮变化的信息(已用时长、对话历史)
 * 不在这里,分别走 buildTurnContext() 和 messages 数组。
 */
export function buildInterviewerSystemPrompt(
  ctx: InterviewPromptContext,
): string {
  return new PromptBuilder<InterviewPromptContext>()
    .pipe('identity', identity())
    .pipe('strategy', strategy())
    .pipe('outputFormat', outputFormat())
    .pipe('positionContext', positionContext())
    .pipe('resumeContext', resumeContext())
    .build(ctx);
}

/** 与 buildInterviewerSystemPrompt 相同的 builder,但额外打印各 section 的开关状态。 */
export function debugInterviewerSystemPrompt(
  ctx: InterviewPromptContext,
): string {
  const builder = new PromptBuilder<InterviewPromptContext>()
    .pipe('identity', identity())
    .pipe('strategy', strategy())
    .pipe('outputFormat', outputFormat())
    .pipe('positionContext', positionContext())
    .pipe('resumeContext', resumeContext());
  builder.debug(ctx);
  return builder.build(ctx);
}

/**
 * 构建「当轮上下文」—— 每轮都会变的信息。
 *
 * 注入到当轮用户消息的开头(而非 system prompt),因此不破坏 system 前缀的缓存。
 * 包含已用 / 目标时长,以及接近结束(达到 80% 时长)时的收尾提示。
 *
 * @param elapsedMinutes 已用时长(分钟)
 * @param targetDuration 目标时长(分钟)
 */
export function buildTurnContext(
  elapsedMinutes: number,
  targetDuration: number,
): string {
  const shouldConsiderEnding = elapsedMinutes >= targetDuration * 0.8;
  const endingNote = shouldConsiderEnding
    ? `\n⚠️ 已接近目标时长（${elapsedMinutes}/${targetDuration} 分钟）。如果当前话题已讨论完毕，应准备结束面试，并在结束语后单独一行输出 [END_INTERVIEW]。`
    : '';
  return `<turn-context>
已用时间: ${elapsedMinutes} / ${targetDuration} 分钟${endingNote}
</turn-context>`;
}
