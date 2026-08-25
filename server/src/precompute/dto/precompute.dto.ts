import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class LocalizedTextDto {
  @IsString()
  @MaxLength(200)
  'zh-CN'!: string;

  @IsString()
  @MaxLength(200)
  'en-US'!: string;
}

class LocalizedDescriptionDto {
  @IsString()
  @MaxLength(5000)
  'zh-CN'!: string;

  @IsString()
  @MaxLength(5000)
  'en-US'!: string;
}

export class UpsertPopularPositionDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,79}$/)
  positionKey!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  names!: LocalizedTextDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  jobDescriptions!: LocalizedDescriptionDto;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsInt()
  @Min(0)
  @Max(1000)
  @IsOptional()
  priority?: number;

  @IsInt()
  @Min(1)
  @Max(720)
  @IsOptional()
  refreshHours?: number;
}

export class CreatePrecomputeBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsOptional()
  positionKeys?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsIn(['zh-CN', 'en-US'], { each: true })
  @IsOptional()
  locales?: Array<'zh-CN' | 'en-US'>;
}
