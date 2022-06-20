import { HttpException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseDTO {
  @ApiProperty()
  readonly data?: any;

  @ApiProperty()
  readonly total?: number;

  @ApiProperty()
  readonly error?: HttpException;

  @ApiProperty()
  readonly message?: string;

  @ApiProperty()
  readonly statusCode?: number;
}
