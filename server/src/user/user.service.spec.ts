import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from './schemas/user.schema';
import { ConsumptionRecord } from '../interview/schemas/consumption-record.schema';
import { UserConsumption } from './schemas/consumption-record.schema';
import { UserTransaction } from '../payment/schemas/user-transaction.schema';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: getModelToken(ConsumptionRecord.name),
          useValue: {},
        },
        {
          provide: getModelToken(UserConsumption.name),
          useValue: {},
        },
        {
          provide: getModelToken(UserTransaction.name),
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
