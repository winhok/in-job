import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConnectionStates, type Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    if (this.connection.readyState !== ConnectionStates.connected) {
      throw new ServiceUnavailableException('MongoDB 尚未就绪');
    }
    const qdrantUrl = this.configService.get<string>('QDRANT_URL');
    let qdrant: 'connected' | 'disabled' = 'disabled';
    if (
      qdrantUrl &&
      this.configService.get<string>('RAG_ENABLED') !== 'false'
    ) {
      try {
        const response = await fetch(
          `${qdrantUrl.replace(/\/$/, '')}/collections`,
          {
            headers: this.configService.get<string>('QDRANT_API_KEY')
              ? { 'api-key': this.configService.get<string>('QDRANT_API_KEY')! }
              : undefined,
            signal: AbortSignal.timeout(3_000),
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        qdrant = 'connected';
      } catch {
        throw new ServiceUnavailableException('Qdrant 尚未就绪');
      }
    }
    return {
      status: 'ready',
      mongodb: 'connected',
      qdrant,
      timestamp: new Date().toISOString(),
    };
  }
}
