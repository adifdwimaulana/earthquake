import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MessageResponse {
  constructor(message: string) {
    this.message = message;
  }

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully.',
  })
  @IsString()
  message: string;
}
