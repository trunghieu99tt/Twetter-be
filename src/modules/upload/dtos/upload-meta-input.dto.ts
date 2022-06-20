import { IsString } from 'class-validator';

export class UploadMetaInput {
  @IsString()
  readonly type: 'avatar' | 'tweet' | 'background';
}
