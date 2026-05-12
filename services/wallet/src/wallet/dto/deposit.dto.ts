import { IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider, PaymentMethod, CurrencyCode } from '@panda-ng/types';

export class CreateDepositDto {
  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ description: 'Amount in cents (min 100 PHP = 10000 cents)', example: 100000 })
  @IsInt()
  @Min(10000)
  @Max(1_000_000_000) // max 10M PHP (1,000,000,000 cents)
  amountInCents!: number;

  @ApiProperty({ enum: CurrencyCode, default: CurrencyCode.PHP })
  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;
}
