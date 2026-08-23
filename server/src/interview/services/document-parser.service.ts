import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios, { isAxiosError } from 'axios';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import * as mammoth from 'mammoth';

/**
 * 文档解析服务
 * 支持从 URL 下载并解析 PDF、DOCX 等格式的简历文件
 */
@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  private readonly supportedTypes = {
    PDF: ['.pdf'],
    DOCX: ['.docx'],
  } as const;

  private readonly maxFileSize = 10 * 1024 * 1024;

  async parseDocumentFromUrl(rawUrl: string): Promise<string> {
    const url = await this.validateUrl(rawUrl);
    const safeUrl = `${url.origin}${url.pathname}`;

    try {
      this.logger.log(`开始解析文档: ${safeUrl}`);
      const buffer = await this.downloadFile(url);
      const fileType = this.getFileType(url);

      const text =
        fileType === 'PDF'
          ? await this.parsePdf(buffer)
          : await this.parseDocx(buffer);

      this.logger.log(`文档解析成功: 长度=${text.length}字符`);
      return text;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`文档解析失败: ${message}`);
      throw error;
    }
  }

  private async validateUrl(rawUrl: string): Promise<URL> {
    let url: URL;

    try {
      url = new URL(rawUrl);
    } catch {
      throw new BadRequestException('URL 格式不正确');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new BadRequestException('仅支持 HTTP 或 HTTPS 文件地址');
    }

    if (url.username || url.password) {
      throw new BadRequestException('URL 不能包含身份凭据');
    }

    if (!this.getFileType(url)) {
      throw new BadRequestException('不支持的文件格式。当前仅支持 PDF、DOCX');
    }

    const addresses = isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true, verbatim: true }).catch(() => {
          throw new BadRequestException('无法解析文件地址');
        });

    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => this.isPrivateAddress(address))
    ) {
      throw new BadRequestException('不允许访问本地或内网文件地址');
    }

    return url;
  }

  private getFileType(url: URL): 'PDF' | 'DOCX' | null {
    const pathname = decodeURIComponent(url.pathname).toLowerCase();

    if (
      this.supportedTypes.PDF.some((extension) => pathname.endsWith(extension))
    ) {
      return 'PDF';
    }

    if (
      this.supportedTypes.DOCX.some((extension) => pathname.endsWith(extension))
    ) {
      return 'DOCX';
    }

    return null;
  }

  private isPrivateAddress(address: string): boolean {
    const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');

    if (normalized.includes(':')) {
      if (
        normalized === '::' ||
        normalized === '::1' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe8') ||
        normalized.startsWith('fe9') ||
        normalized.startsWith('fea') ||
        normalized.startsWith('feb')
      ) {
        return true;
      }

      const ipv4Mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
      return ipv4Mapped ? this.isPrivateAddress(ipv4Mapped[1]) : false;
    }

    const parts = normalized.split('.').map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      return true;
    }

    const [first, second] = parts;
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127) ||
      first >= 224
    );
  }

  private async downloadFile(url: URL): Promise<Buffer> {
    try {
      const response = await axios.get<ArrayBuffer>(url.toString(), {
        responseType: 'arraybuffer',
        timeout: 30_000,
        maxContentLength: this.maxFileSize,
        maxBodyLength: this.maxFileSize,
        maxRedirects: 0,
        headers: {
          'User-Agent': 'ResumeParser/1.0',
        },
      });
      const buffer = Buffer.from(response.data);

      if (buffer.length === 0) {
        throw new BadRequestException('文件为空');
      }
      if (buffer.length > this.maxFileSize) {
        throw new BadRequestException('文件过大，最大支持 10MB');
      }

      return buffer;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new BadRequestException('文件下载超时');
        }
        if (error.response?.status === 404) {
          throw new BadRequestException('文件不存在或已被删除');
        }
        if (error.response?.status === 403) {
          throw new BadRequestException('无权访问该文件');
        }
        if (error.response && error.response.status >= 300) {
          throw new BadRequestException(
            `文件下载失败（HTTP ${error.response.status}）`,
          );
        }
      }
      throw new BadRequestException(
        `文件下载失败: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      if (!data.text?.trim()) {
        throw new BadRequestException(
          'PDF 无法提取文本，请确认文件不是扫描图片、未加密且未损坏',
        );
      }
      return data.text;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `PDF 文件解析失败: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value?.trim()) {
        throw new BadRequestException('DOCX 文件无法提取文本内容');
      }
      if (result.messages.length > 0) {
        this.logger.warn(
          `DOCX 解析警告: ${result.messages.map(({ message }) => message).join('; ')}`,
        );
      }
      return result.value;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `DOCX 文件解析失败: ${this.getErrorMessage(error)}`,
      );
    }
  }

  cleanText(text: string): string {
    return (
      text
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/第\s*\d+\s*页/g, '')
        .replace(/Page\s+\d+/gi, '')
        .trim()
    );
  }

  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) ?? []).length;
    const otherChars = Math.max(text.length - chineseChars, 0);
    return Math.ceil(chineseChars / 1.5 + englishWords + otherChars / 4);
  }

  validateResumeContent(text: string): {
    isValid: boolean;
    reason?: string;
    warnings?: string[];
  } {
    if (text.length < 100) {
      return {
        isValid: false,
        reason: '简历内容过短（少于100个字符），可能解析不完整',
      };
    }

    const warnings: string[] = [];
    if (text.length > 20_000) {
      warnings.push(`简历内容较长（${text.length}字符），可能影响处理速度`);
    }

    const keywords = [
      '姓名',
      '手机',
      '邮箱',
      'email',
      '教育',
      '学历',
      '大学',
      '专业',
      '工作',
      '经验',
      '项目',
      '公司',
      '职位',
      '技能',
      '掌握',
      '熟悉',
      '精通',
    ];
    if (
      keywords.filter((keyword) => text.toLowerCase().includes(keyword))
        .length < 3
    ) {
      warnings.push('简历可能缺少姓名、教育、工作经验等关键信息');
    }
    if (text.split('\n').filter((line) => line.trim()).length < 5) {
      warnings.push('简历格式可能有问题，内容行数过少');
    }

    return { isValid: true, warnings: warnings.length ? warnings : undefined };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
