import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    if (!app) throw new Error('Nest application was not initialized');
    const response = await request(app.getHttpServer()).get('/').expect(200);
    const body = response.body as unknown as {
      code: number;
      message: string;
      data: string;
      path: string;
      timestamp: string;
    };

    expect(body).toMatchObject({
      code: 200,
      message: '操作成功',
      data: 'Hello World!',
      path: '/',
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  afterEach(async () => {
    await app?.close();
  });
});
