import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class ReportFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsBoolean()
  fair!: boolean;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;
}

export class RequestManualReviewDto {
  @IsString()
  @IsIn(['unfair', 'inaccurate', 'technical', 'other'])
  reason!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;
}

export class ResolveManualReviewDto {
  @IsString()
  @IsIn(['reviewing', 'resolved', 'rejected'])
  status!: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  resolution?: string;
}
