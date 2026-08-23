import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 报告生成状态 */
export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** 技能匹配项 */
export class SkillMatchDto {
  @ApiProperty({ description: '技能名称', example: 'Vue.js' })
  skill!: string;

  @ApiProperty({ description: '是否匹配', example: true })
  matched!: boolean;

  @ApiPropertyOptional({
    description: '熟练度描述',
    example: '熟练掌握，有2年项目经验',
  })
  proficiency?: string;
}

/** 雷达图维度数据 */
export class RadarDimensionDto {
  @ApiProperty({ description: '维度名称', example: '技术能力' })
  dimension!: string;

  @ApiProperty({
    description: '得分 (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  score!: number;

  @ApiPropertyOptional({ description: '维度说明', example: '掌握了主流技术栈' })
  description?: string;
}

/** 简历押题分析报告 */
export class ResumeQuizAnalysisDto {
  @ApiProperty({ description: '报告ID', example: 'rq_1234567890' })
  resultId!: string;

  @ApiProperty({ description: '面试类型', example: 'resume_quiz' })
  type!: 'resume_quiz';

  @ApiProperty({ description: '公司名称', example: '字节跳动' })
  company!: string;

  @ApiProperty({ description: '岗位名称', example: '前端开发工程师' })
  position!: string;

  @ApiPropertyOptional({ description: '薪资范围', example: '20K-35K' })
  salaryRange?: string;

  @ApiProperty({ description: '生成时间', example: '2025-11-28T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: '简历与岗位匹配度', minimum: 0, maximum: 100 })
  matchScore!: number;

  @ApiProperty({
    description: '匹配度等级',
    enum: ['优秀', '良好', '中等', '较差'],
  })
  matchLevel!: string;

  @ApiProperty({ description: '匹配的技能', type: [SkillMatchDto] })
  matchedSkills!: SkillMatchDto[];

  @ApiProperty({ description: '缺失的技能', type: [String] })
  missingSkills!: string[];

  @ApiProperty({ description: '需要补充的知识点', type: [String] })
  knowledgeGaps!: string[];

  @ApiProperty({ description: '学习优先级', type: [Object] })
  learningPriorities!: Array<{
    topic: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;

  @ApiProperty({ description: '雷达图维度数据', type: [RadarDimensionDto] })
  radarData!: RadarDimensionDto[];

  @ApiProperty({ description: '总体优势', type: [String] })
  strengths!: string[];

  @ApiProperty({ description: '薄弱环节', type: [String] })
  weaknesses!: string[];

  @ApiProperty({ description: 'AI综合评估' })
  summary!: string;

  @ApiProperty({ description: '面试准备建议', type: [String] })
  interviewTips!: string[];

  @ApiProperty({ description: '问题总数' })
  totalQuestions!: number;

  @ApiProperty({ description: '各类别问题分布', type: Object })
  questionDistribution!: Record<string, number>;

  @ApiProperty({ description: '查看次数' })
  viewCount!: number;
}
