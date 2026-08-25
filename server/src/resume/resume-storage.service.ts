import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';

@Injectable()
export class ResumeStorageService {
  constructor(private readonly configService: ConfigService) {}

  canonicalUrl(objectKey: string): string {
    const { bucket, region } = this.storageLocation();
    const encodedKey = objectKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `https://${bucket}.${region}.aliyuncs.com/${encodedKey}`;
  }

  signReadUrl(objectKey: string): string {
    return this.client().signatureUrl(objectKey, {
      method: 'GET',
      expires: 15 * 60,
    });
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client().delete(objectKey);
  }

  private client(): OSS {
    const { bucket, region } = this.storageLocation();
    const accessKeyId = this.configService.get<string>('ALIYUN_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>(
      'ALIYUN_ACCESS_KEY_SECRET',
    );
    if (!accessKeyId || !accessKeySecret) {
      throw new ServiceUnavailableException('OSS 文件服务尚未配置');
    }
    return new OSS({ region, bucket, accessKeyId, accessKeySecret });
  }

  private storageLocation(): { bucket: string; region: string } {
    const bucket = this.configService.get<string>('ALIYUN_OSS_BUCKET');
    const region = this.configService.get<string>('ALIYUN_OSS_REGION');
    if (!bucket || !region) {
      throw new ServiceUnavailableException('OSS bucket 或 region 尚未配置');
    }
    return { bucket, region };
  }
}
