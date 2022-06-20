import { IsString } from 'class-validator';
import { UserDocument } from 'src/modules/user/user.entity';

export class CreateMessageDTO {
  @IsString()
  content: string;

  @IsString()
  file: string;

  author: UserDocument;

  @IsString()
  roomId: string;
}
