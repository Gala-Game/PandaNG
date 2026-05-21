import { IsEnum, IsPositive, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GameTypeDto {
  SLOTS = 'SLOTS',
  CRASH = 'CRASH',
  DRAGON_DICE = 'DRAGON_DICE',
  PANDA_SPIN = 'PANDA_SPIN',
  BAMBOO_BLAST = 'BAMBOO_BLAST',
}

export class StartGameDto {
  @ApiProperty({ enum: GameTypeDto })
  @IsEnum(GameTypeDto)
  gameType: GameTypeDto;

  @ApiProperty({ description: 'Bet amount in cents', example: 1000 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(10)
  @Max(100_000_000)
  betAmountInCents: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientSeed?: string;
}
