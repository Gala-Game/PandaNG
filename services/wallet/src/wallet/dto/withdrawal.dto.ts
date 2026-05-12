import { IsEnum, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, CurrencyCode } from '@panda-ng/types';

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Amount in cents (min 100 PHP = 10000 cents)', example: 50000 })
  @IsInt()
  @Min(10000)
  @Max(10_000_000) // Max 100,000 PHP (matches MAX_DAILY_WITHDRAWAL_CENTS)
  amountInCents!: number;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiPropertyOptional({ enum: CurrencyCode })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eWalletNumber?: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  accountName!: string;
}
