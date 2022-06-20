import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsString } from 'class-validator';

export class CreateCommentDTO {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty()
  @IsString()
  media: string;

  @ApiProperty()
  @IsDate()
  modifiedAt: Date;

  @ApiProperty()
  @IsBoolean()
  isEdited: boolean;

  @ApiProperty()
  @IsDate()
  createdAt: Date;
}
