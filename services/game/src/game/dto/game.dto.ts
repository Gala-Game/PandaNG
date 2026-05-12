import {
  IsEnum,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GameTypeDto {
  SLOTS = 'SLOTS',
  CRASH = 'CRASH',
  DRAGON_DICE = 'DRAGON_DICE',
  PANDA_SPIN = 'PANDA_SPIN',
  MINI_GAME = 'MINI_GAME',
  SCRATCH_CARD = 'SCRATCH_CARD',
  ROULETTE = 'ROULETTE',
  BAMBOO_BLAST = 'BAMBOO_BLAST',
}

export class StartSessionDto {
  @ApiProperty({ enum: GameTypeDto })
  @IsEnum(GameTypeDto)
  gameType: GameTypeDto;

  @ApiProperty({ description: 'Bet amount in cents (integer, no floats)', example: 10000 })
  @IsInt()
  @IsPositive()
  @Max(100_000_000)
  betAmountInCents: number;

  @ApiPropertyOptional({ description: 'Client-provided entropy seed' })
  @IsOptional()
  @IsString()
  clientSeed?: string;

  @ApiPropertyOptional({ description: 'RTP profile ID to use' })
  @IsOptional()
  @IsString()
  rtpProfileId?: string;
}

export class ResolveSlotsDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class ResolveCrashDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Multiplier at which the player cashed out', example: 2.5 })
  @IsNumber()
  @IsPositive()
  @Max(10000)
  cashoutMultiplier: number;
}

export class ResolveDiceDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ example: 55, description: 'Target number [2..98]' })
  @IsInt()
  @Min(2)
  @Max(98)
  target: number;

  @ApiProperty({ enum: ['over', 'under'] })
  @IsEnum(['over', 'under'])
  mode: 'over' | 'under';
}

export class ResolveWheelDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class ResolveTreasureDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Indices of tiles the player picked (0-19)', example: [3, 7, 12] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(16)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(19, { each: true })
  pickedIndices: number[];
}
