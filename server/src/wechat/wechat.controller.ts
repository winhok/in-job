import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Parser } from 'xml2js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';
import { QrCodeStatus, WechatMessage } from './dto/wechat.dto';
import { WechatAdminGuard } from './wechat-admin.guard';
import { WechatService } from './wechat.service';

@Controller('wechat')
export class WechatController {
  private readonly logger = new Logger(WechatController.name);

  constructor(private readonly wechatService: WechatService) {}

  @Post('qrcode')
  async generateQrCode() {
    const result = await this.wechatService.generateLoginQrCode();
    return ResponseUtil.success(result, '二维码生成成功');
  }

  @Get('check-qr-status')
  async checkQrStatus(@Query('id') qrCodeId?: string) {
    if (!qrCodeId) {
      throw new BadRequestException('缺少二维码 ID');
    }

    const result = await this.wechatService.getQrCodeStatus(qrCodeId);
    if (result.status === QrCodeStatus.EXPIRED) {
      return ResponseUtil.error('二维码不存在或已过期', 404);
    }
    if (result.status === QrCodeStatus.CONFIRMED) {
      return ResponseUtil.success(
        { user: result.user, token: result.token },
        '扫码成功',
      );
    }
    return ResponseUtil.error('等待扫码', 202, {
      status: result.status,
    });
  }

  @Get('validateToken')
  validateWechatServer(
    @Query('signature') signature: string | undefined,
    @Query('timestamp') timestamp: string | undefined,
    @Query('nonce') nonce: string | undefined,
    @Query('echostr') echoString: string | undefined,
    @Res() response: Response,
  ): void {
    if (
      !signature ||
      !timestamp ||
      !nonce ||
      !echoString ||
      !this.wechatService.verifyWechatSignature(signature, timestamp, nonce)
    ) {
      throw new UnauthorizedException('微信服务器签名校验失败');
    }
    response.type('text/plain').send(echoString);
  }

  @Post('validateToken')
  async receiveWechatMessage(
    @Query('signature') signature: string | undefined,
    @Query('timestamp') timestamp: string | undefined,
    @Query('nonce') nonce: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    if (
      !signature ||
      !timestamp ||
      !nonce ||
      !this.wechatService.verifyWechatSignature(signature, timestamp, nonce)
    ) {
      throw new UnauthorizedException('微信服务器签名校验失败');
    }

    const rawXml = await this.readXmlBody(request);
    const parsed = (await new Parser({
      explicitArray: false,
      trim: true,
    }).parseStringPromise(rawXml)) as { xml?: WechatMessage };
    const message = parsed.xml;
    if (!message?.MsgType || !message.FromUserName) {
      throw new BadRequestException('微信消息格式无效');
    }

    const event = message.Event?.toUpperCase();
    this.logger.log(
      `收到微信事件：type=${message.MsgType}, event=${event ?? 'none'}`,
    );

    let reply = 'success';
    if (message.MsgType === 'event' && event === 'SUBSCRIBE') {
      this.wechatService.markQrCodeScanned(message, message.FromUserName);
      reply = this.wechatService.handleSubscribe(message);
    } else if (message.MsgType === 'event' && event === 'SCAN') {
      this.wechatService.markQrCodeScanned(message, message.FromUserName);
      reply = this.wechatService.handleSubscribe(message);
    } else if (message.MsgType === 'event' && event === 'CLICK') {
      reply = await this.wechatService.handleMenuClick(message);
    }

    response.type('text/xml; charset=utf-8').send(reply);
  }

  @Post('create-menu')
  @UseGuards(JwtAuthGuard, WechatAdminGuard)
  async createMenu() {
    const result = await this.wechatService.createMenu();
    return ResponseUtil.success(result, '创建菜单成功');
  }

  @Post('delete-menu')
  @UseGuards(JwtAuthGuard, WechatAdminGuard)
  async deleteMenu() {
    const result = await this.wechatService.deleteMenu();
    return ResponseUtil.success(result, '删除菜单成功');
  }

  @Get('get-menu')
  @UseGuards(JwtAuthGuard, WechatAdminGuard)
  async getMenu() {
    const result = await this.wechatService.getMenu();
    return ResponseUtil.success(result, '获取菜单成功');
  }

  private async readXmlBody(request: Request): Promise<string> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const buffer = Buffer.from(chunk as Uint8Array);
      size += buffer.length;
      if (size > 1024 * 1024) {
        throw new BadRequestException('微信消息体过大');
      }
      chunks.push(buffer);
    }

    const rawXml = Buffer.concat(chunks).toString('utf8').trim();
    if (!rawXml) {
      throw new BadRequestException('微信消息体为空');
    }
    return rawXml;
  }
}
