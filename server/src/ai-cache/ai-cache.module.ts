import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiCacheService } from './ai-cache.service';
import {
  AiResultCache,
  AiResultCacheSchema,
} from './schemas/ai-result-cache.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AdminGuard } from '../review/admin.guard';
import { AiCacheController } from './ai-cache.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiResultCache.name, schema: AiResultCacheSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AiCacheController],
  providers: [AiCacheService, AdminGuard],
  exports: [AiCacheService],
})
export class AiCacheModule {}
