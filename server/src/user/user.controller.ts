import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { ResponseUtil } from '../common/utils/response.util';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request as ExpressRequest } from 'express';
import { EntitlementService } from '../payment/entitlement.service';
import { ClaimShareRewardDto } from '../payment/dto/payment.dto';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
  };
}

@Controller('user')
@UseGuards(JwtAuthGuard) // 使用认证守卫
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly entitlementService: EntitlementService,
  ) {}

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.userService.register(registerDto);
    return ResponseUtil.success(result, '注册成功');
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.login(loginDto);
    return ResponseUtil.success(result, '登录成功');
  }

  @Get('info')
  async getUserInfo(@Request() req: AuthenticatedRequest) {
    const { userId } = req.user;
    const userInfo = await this.userService.getUserInfo(userId);
    return ResponseUtil.success(userInfo, '获取成功');
  }

  @Put('profile')
  async updateUserProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { userId } = req.user;
    const user = await this.userService.updateUser(userId, updateUserDto);
    return ResponseUtil.success(user, '更新成功');
  }

  /**
   * 获取用户消费记录（包括简历押题、专项面试、综合面试）
   */
  @Get('consumption-records')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '获取用户消费记录',
    description:
      '获取用户所有的功能消费记录，包括简历押题、专项面试、综合面试等',
  })
  async getUserConsumptionRecords(
    @Request() req: AuthenticatedRequest,
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 20,
  ) {
    const { userId } = req.user;
    const result = await this.userService.getUserConsumptionRecords(userId, {
      skip,
      limit,
    });
    return ResponseUtil.success(result, '获取成功');
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return ResponseUtil.success(
      await this.userService.getUserTransactions(req.user.userId, page, limit),
      '获取成功',
    );
  }

  @Post('share-reward')
  @RateLimit(3, 60_000)
  async claimShareReward(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ClaimShareRewardDto,
  ) {
    void dto.source;
    return ResponseUtil.success(
      await this.entitlementService.claimShareReward(req.user.userId),
      '分享奖励领取成功',
    );
  }
}
