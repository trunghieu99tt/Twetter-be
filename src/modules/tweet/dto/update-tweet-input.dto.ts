import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { EAudience } from 'src/common/config/constants';

export enum EUpdateTweetType {
  CONTENT = 'content',
  RETWEET = 'retweet',
  REACT = 'react',
  SAVE = 'save',
  SHARE = 'share',
}

export class UpdateTweetInputDto {
  @ApiProperty({
    type: 'enum',
    enum: EUpdateTweetType,
  })
  type: EUpdateTweetType;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  content: string;

  @IsOptional()
  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  tags: string[];

  @IsOptional()
  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  media: string[];

  @IsOptional()
  @ApiPropertyOptional({
    type: 'enum',
    enum: EAudience,
  })
  audience: EAudience;
}
