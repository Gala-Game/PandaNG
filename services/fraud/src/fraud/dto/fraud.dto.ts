import { IsString, IsInt, Min, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScoreTransactionDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Transaction amount in cents', minimum: 1 })
  @IsInt()
  @Min(1)
  amountInCents!: number;

  @ApiProperty({ description: 'Transaction type, e.g. DEPOSIT, WITHDRAWAL, BET' })
  @IsString()
  type!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  fingerprint!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class ResolveSignalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
