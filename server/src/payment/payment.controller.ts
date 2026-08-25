import {
  Body,
  Controller,
  Headers,
  Post,
  Request,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';
import { InitiatePaymentDto, QueryPaymentStatusDto } from './dto/payment.dto';
import { PaymentChannel } from './payment.types';
import { PaymentService } from './payment.service';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string };
}

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('order')
  @RateLimit(10, 60_000)
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return ResponseUtil.success(
      await this.paymentService.initiatePayment(request.user.userId, dto),
      '订单创建成功',
    );
  }

  @Post('order/status')
  @RateLimit(60, 60_000)
  @UseGuards(JwtAuthGuard)
  async queryPaymentStatus(
    @Body() dto: QueryPaymentStatusDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return ResponseUtil.success(
      await this.paymentService.queryPaymentStatus(request.user.userId, dto),
      '查询成功',
    );
  }

  @Post('callback/alipay')
  async alipayCallback(
    @Body() body: Record<string, unknown>,
    @Res() response: Response,
  ) {
    await this.paymentService.handleNotification(PaymentChannel.ALIPAY, body);
    response.type('text/plain').send('success');
  }

  @Post('callback/wechat')
  async wechatCallback(
    @Body() body: Record<string, unknown>,
    @Req() request: ExpressRequest & { rawBody?: Buffer },
    @Headers('wechatpay-timestamp') timestamp: string | undefined,
    @Headers('wechatpay-nonce') nonce: string | undefined,
    @Headers('wechatpay-signature') signature: string | undefined,
    @Res() response: Response,
  ) {
    await this.paymentService.handleNotification(
      PaymentChannel.WECHAT,
      { ...body, __rawBody: request.rawBody?.toString('utf8') || '' },
      { timestamp, nonce, signature },
    );
    response.status(200).json({ code: 'SUCCESS', message: '成功' });
  }
}
