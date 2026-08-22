import {
  Controller,
  Post,
  UseGuards,
  NotImplementedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('interview')
export class InterviewController {
  // 接口 1：简历押题
  @Post('resume/quiz/stream')
  @UseGuards(JwtAuthGuard)
  resumeQuizStream(): never {
    throw new NotImplementedException('简历押题接口尚未实现');
  }

  // 接口 2：开始模拟面试
  @Post('mock/start')
  @UseGuards(JwtAuthGuard)
  startMockInterview(): never {
    throw new NotImplementedException('模拟面试开始接口尚未实现');
  }

  // 接口 3：回答面试问题
  @Post('mock/answer')
  @UseGuards(JwtAuthGuard)
  answerMockInterview(): never {
    throw new NotImplementedException('模拟面试回答接口尚未实现');
  }

  // 接口 4：结束面试
  @Post('mock/end')
  @UseGuards(JwtAuthGuard)
  endMockInterview(): never {
    throw new NotImplementedException('模拟面试结束接口尚未实现');
  }
}
