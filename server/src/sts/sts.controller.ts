import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';
import { ResponseUtil } from '../common/utils/response.util';
import { StsService } from './sts.service';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

@Controller('sts')
export class StsController {
  constructor(private readonly stsService: StsService) {}

  @Get('getStsToken')
  @RateLimit(10, 60_000)
  @UseGuards(JwtAuthGuard)
  async getStsToken(@CurrentUser() user: CurrentUserData) {
    return ResponseUtil.success(
      await this.stsService.assumeUploadRole(user.userId),
      '临时凭证获取成功',
    );
  }
}
