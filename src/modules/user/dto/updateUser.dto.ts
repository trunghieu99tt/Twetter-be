import { PartialType } from "@nestjs/swagger";
import { UserDTO } from "./user.dto";

export class UpdateUserDTO extends PartialType(UserDTO) {
    oldPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
}
