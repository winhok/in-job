import { IsEnum } from 'class-validator';

export enum ExchangePackageType {
  RESUME_QUIZ = 'resume',
  SPECIAL_INTERVIEW = 'special',
  BEHAVIOR_INTERVIEW = 'behavior',
}

export class ExchangePackageDto {
  @IsEnum(ExchangePackageType)
  packageType!: ExchangePackageType;
}
