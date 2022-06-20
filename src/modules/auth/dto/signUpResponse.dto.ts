import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/modules/user/user.entity';

export class SignUpResponseDTO {
  @ApiProperty()
  readonly user: User;
  @ApiProperty()
  readonly refreshToken: string;
}
