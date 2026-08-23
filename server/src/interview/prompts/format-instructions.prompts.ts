/**
 * 仅面试题和综合评估的输出格式。
 */
export const FORMAT_INSTRUCTIONS_QUESTIONS_ONLY = `
请严格按照以下 JSON 格式返回结果：

{
  "questions": [
    {
      "question": "问题内容（清晰、具体）",
      "answer": "参考答案（结合候选人背景，200-300字）",
      "category": "technical | project | problem-solving | soft-skill",
      "difficulty": "easy | medium | hard",
      "tips": "回答要点",
      "keywords": ["关键词1", "关键词2"],
      "reasoning": "考察目的和判断依据"
    }
  ],
  "summary": "候选人优势、薄弱点和面试策略（150-200字）"
}

注意：
1. questions 数组长度为 3-5。
2. 每个问题必须包含上述字段。
3. 返回有效 JSON，不要包含 Markdown 代码块或 JSON 之外的文字。
4. JSON 字符串中的引号、反斜杠和换行必须正确转义。
`;

/**
 * 仅岗位匹配度分析的输出格式。
 */
export const FORMAT_INSTRUCTIONS_ANALYSIS_ONLY = `
请严格按照以下 JSON 格式返回结果：

{
  "matchScore": 85,
  "matchLevel": "良好",
  "matchedSkills": [
    { "skill": "Vue.js", "matched": true, "proficiency": "熟练掌握，有2年项目经验" }
  ],
  "missingSkills": ["TypeScript", "Docker"],
  "knowledgeGaps": ["需要系统学习TypeScript类型系统"],
  "learningPriorities": [
    { "topic": "TypeScript", "priority": "high", "reason": "JD明确要求" }
  ],
  "radarData": [
    { "dimension": "技术能力", "score": 85, "description": "掌握主流前端技术栈" },
    { "dimension": "项目经验", "score": 80, "description": "有多个项目实战经验" },
    { "dimension": "问题解决能力", "score": 75, "description": "具备独立解决问题的能力" },
    { "dimension": "软技能", "score": 78, "description": "具备团队协作和沟通能力" }
  ],
  "strengths": ["具有相关技术栈的项目经验"],
  "weaknesses": ["部分JD要求的技能经验不足"],
  "interviewTips": ["重点准备JD明确要求的技术"]
}

注意：
1. radarData 至少包含 4 个维度，所有评分均在 0-100 之间。
2. 返回有效 JSON，不要包含 Markdown 代码块或 JSON 之外的文字。
3. 所有结论必须基于简历和 JD 中的事实。
`;
