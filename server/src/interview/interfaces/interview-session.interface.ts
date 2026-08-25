import { MockInterviewType } from '../dto/mock-interview.dto';

export interface InterviewConversationEntry {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  standardAnswer?: string;
}

export interface InterviewSession {
  sessionId: string;
  resultId?: string;
  consumptionRecordId?: string;
  userId: string;
  interviewType: MockInterviewType;
  interviewerName: string;
  candidateName?: string;
  company: string;
  positionName?: string;
  salaryRange?: string;
  jd?: string;
  resumeContent: string;
  conversationHistory: InterviewConversationEntry[];
  questionCount: number;
  startTime: Date;
  targetDuration: number;
  isActive: boolean;
  locale: 'zh-CN' | 'en-US';
}
