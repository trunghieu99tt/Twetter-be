import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/modules/user/user.entity";


export class AccessTokenResponse {
    @ApiProperty()
    user: User;
    @ApiProperty()
    accessToken: string;
}
