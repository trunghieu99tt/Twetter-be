import { PartialType, PickType } from "@nestjs/swagger";
import { UserDTO } from "./user.dto";

export class RegisterUserDTO extends PartialType(PickType(UserDTO, [
    'name',
    'username',
    'password',
    'passwordConfirm'
])) { }
