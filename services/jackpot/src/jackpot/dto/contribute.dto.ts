import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContributeDto {
  @ApiProperty({ description: 'Bet amount in cents (integer)', minimum: 1 })
  @IsInt()
  @Min(1)
  betAmountInCents!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gameSessionId!: string;
}
