import { Transform } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UploadResumeDto {
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  url!: string;

  @IsString()
  @MaxLength(120)
  resumeName!: string;

  @IsString()
  @Matches(/^user-resumes\/[a-f\d]{24}\/resumes\/[a-zA-Z0-9._-]+$/)
  objectKey!: string;

  @Transform(({ value }: { value: unknown }) => new Date(String(value)))
  @IsDate()
  uploadTime!: Date;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mimeType?: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  @IsOptional()
  fileSize?: number;
}

export class ResumeIdDto {
  @IsString()
  resumeId!: string;
}

export class UpdateResumeNameDto extends ResumeIdDto {
  @IsString()
  @MaxLength(10)
  resumeName!: string;
}
