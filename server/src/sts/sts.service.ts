import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, randomUUID } from 'node:crypto';

interface StsCredentialsResponse {
  Credentials?: {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
  };
}

@Injectable()
export class StsService {
  constructor(private readonly configService: ConfigService) {}

  async assumeUploadRole(userId: string) {
    const accessKeyId = this.configService.get<string>('ALIYUN_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>(
      'ALIYUN_ACCESS_KEY_SECRET',
    );
    const roleArn = this.configService.get<string>('ALIYUN_STS_ROLE_ARN');
    const bucket = this.configService.get<string>('ALIYUN_OSS_BUCKET');
    const endpoint =
      this.configService.get<string>('ALIYUN_STS_ENDPOINT') ||
      'https://sts.aliyuncs.com/';
    if (!accessKeyId || !accessKeySecret || !roleArn || !bucket) {
      throw new ServiceUnavailableException('OSS 临时凭证服务尚未配置');
    }

    const policy = JSON.stringify({
      Version: '1',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['oss:PutObject'],
          Resource: [`acs:oss:*:*:${bucket}/user-resumes/${userId}/*`],
        },
      ],
    });
    const parameters: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'AssumeRole',
      DurationSeconds: '900',
      Format: 'JSON',
      Policy: policy,
      RoleArn: roleArn,
      RoleSessionName: `resume-${userId.slice(-12)}`,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: randomUUID(),
      SignatureVersion: '1.0',
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      Version: '2015-04-01',
    };
    const canonicalQuery = Object.entries(parameters)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, value]) =>
          `${this.percentEncode(key)}=${this.percentEncode(value)}`,
      )
      .join('&');
    const stringToSign = `GET&%2F&${this.percentEncode(canonicalQuery)}`;
    const signature = createHmac('sha1', `${accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');

    try {
      const response = await axios.get<StsCredentialsResponse>(endpoint, {
        params: { ...parameters, Signature: signature },
        timeout: 10_000,
      });
      if (!response.data.Credentials) {
        throw new Error('STS 响应缺少 Credentials');
      }
      return response.data.Credentials;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new BadGatewayException('OSS 临时凭证获取失败');
    }
  }

  private percentEncode(value: string): string {
    return encodeURIComponent(value)
      .replace(
        /[!'()*]/g,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
      )
      .replace(/%7E/g, '~');
  }
}
