import { ApiProperty } from '@nestjs/swagger';

export class PaginationRequestDTO {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly pageSize: number;
}
