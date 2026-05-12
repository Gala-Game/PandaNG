import { IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveGameDto {
  @ApiPropertyOptional({ description: 'Crash cash-out multiplier (CRASH game)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.0)
  @Max(1000)
  cashOutAt?: number;

  @ApiPropertyOptional({ description: 'Dice target (2-98)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(98)
  target?: number;

  @ApiPropertyOptional({ description: 'Dice over (true) or under (false)' })
  @IsOptional()
  @IsBoolean()
  isOver?: boolean;
}
