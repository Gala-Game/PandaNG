import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerWinDto {
  @ApiProperty({ description: 'ID of the user who will receive the jackpot win' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Game session ID associated with this win' })
  @IsString()
  @IsNotEmpty()
  gameSessionId!: string;
}
