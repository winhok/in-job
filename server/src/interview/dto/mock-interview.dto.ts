import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum MockInterviewType {
  SPECIAL = 'special',
  COMPREHENSIVE = 'behavior',
}

const optionalNumber = ({ value }: { value: unknown }): unknown => {
  if (value === '' || value === null || value === undefined) return undefined;
  return typeof value === 'string' ? Number(value) : value;
};

export class StartMockInterviewDto {
  @ApiProperty({ enum: MockInterviewType, example: MockInterviewType.SPECIAL })
  @IsEnum(MockInterviewType, { message: '面试类型无效' })
  @IsNotEmpty({ message: '面试类型不能为空' })
  interviewType!: MockInterviewType;

  @ApiProperty({ example: '张三', required: false, maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: '候选人姓名不能超过50个字符' })
  candidateName?: string;

  @ApiProperty({ example: '字节跳动', required: false, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '公司名称不能超过100个字符' })
  company?: string;

  @ApiProperty({ example: '前端开发工程师', required: false, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '岗位名称不能超过100个字符' })
  positionName?: string;

  @ApiProperty({ example: 20, required: false })
  @Transform(optionalNumber)
  @IsNumber({}, { message: '最低薪资必须是数字' })
  @Min(0, { message: '最低薪资不能小于0' })
  @Max(9999, { message: '最低薪资不能超过9999K' })
  @IsOptional()
  minSalary?: number;

  @ApiProperty({ example: 35, required: false })
  @Transform(optionalNumber)
  @IsNumber({}, { message: '最高薪资必须是数字' })
  @Min(0, { message: '最高薪资不能小于0' })
  @Max(9999, { message: '最高薪资不能超过9999K' })
  @IsOptional()
  maxSalary?: number;

  @ApiProperty({ example: '负责前端架构设计...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: '职位描述不能超过5000个字符' })
  jd?: string;

  @ApiProperty({ example: 'uuid-xxx-xxx', required: false })
  @IsString()
  @IsOptional()
  resumeId?: string;

  @ApiProperty({ example: '个人信息：张三...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10000, { message: '简历内容不能超过10000个字符' })
  resumeContent?: string;
}

export class AnswerMockInterviewDto {
  @ApiProperty({ description: '面试会话ID', example: 'uuid-xxx-xxx' })
  @IsString()
  @IsNotEmpty({ message: '面试会话ID不能为空' })
  sessionId!: string;

  @ApiProperty({ description: '候选人的回答', maxLength: 5000 })
  @IsString()
  @IsNotEmpty({ message: '回答内容不能为空' })
  @MaxLength(5000, { message: '回答内容不能超过5000个字符' })
  answer!: string;
}

export enum MockInterviewEventType {
  START = 'start',
  QUESTION = 'question',
  WAITING = 'waiting',
  REFERENCE_ANSWER = 'reference_answer',
  THINKING = 'thinking',
  END = 'end',
  ERROR = 'error',
}

export class MockInterviewEventDto {
  @ApiProperty({ enum: MockInterviewEventType })
  type!: MockInterviewEventType;

  sessionId?: string;
  interviewerName?: string;
  content?: string;
  questionNumber?: number;
  totalQuestions?: number;
  elapsedMinutes?: number;
  error?: string;
  resultId?: string;
  isStreaming?: boolean;
  metadata?: Record<string, unknown>;
}
