import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../review/admin.guard';
import { AiCacheService } from './ai-cache.service';

@Controller('admin/ai-cache')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AiCacheController {
  constructor(private readonly cacheService: AiCacheService) {}

  @Delete('scopes/:scopeKey')
  async invalidateScope(
    @Param('scopeKey') scopeKey: string,
    @Query('operation') operation?: string,
  ) {
    const deletedCount = await this.cacheService.invalidateScope(
      scopeKey,
      operation,
    );
    return { scopeKey, operation, deletedCount };
  }
}
