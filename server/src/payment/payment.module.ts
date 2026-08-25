import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import {
  PaymentRecord,
  PaymentRecordSchema,
} from './schemas/payment-record.schema';
import {
  UserTransaction,
  UserTransactionSchema,
} from './schemas/user-transaction.schema';
import { AlipayPaymentService } from './providers/alipay-payment.service';
import { WechatPaymentService } from './providers/wechat-payment.service';
import { EntitlementService } from './entitlement.service';
import { TestPaymentService } from './providers/test-payment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentRecord.name, schema: PaymentRecordSchema },
      { name: UserTransaction.name, schema: UserTransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    EntitlementService,
    AlipayPaymentService,
    WechatPaymentService,
    TestPaymentService,
  ],
  exports: [EntitlementService],
})
export class PaymentModule {}
