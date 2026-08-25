import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaymentChannel } from '../payment.types';

export class InitiatePaymentDto {
  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;

  @IsString()
  @IsIn(['single', 'pro', 'max', 'ultra', 'custom'])
  planId!: string;

  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(10000)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsIn(['web', 'h5'])
  @IsOptional()
  source?: string;
}

export class QueryPaymentStatusDto {
  @IsString()
  orderId!: string;

  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;
}

export class ClaimShareRewardDto {
  @IsString()
  @IsIn(['profile_share'])
  source!: 'profile_share';
}

export enum ExchangePackageType {
  RESUME = 'resume',
  SPECIAL = 'special',
  BEHAVIOR = 'behavior',
}

export class ExchangePackageDto {
  @IsEnum(ExchangePackageType)
  packageType!: ExchangePackageType;
}
