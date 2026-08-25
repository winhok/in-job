import { Controller, Get } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('interview-count')
  async getInterviewCount() {
    return ResponseUtil.success(
      await this.adminService.getActiveInterviewCount(),
      '查询成功',
    );
  }
}
