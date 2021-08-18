import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCommentDTO {
    @ApiProperty()
    @IsString()
    content: string;

    @ApiProperty()
    @IsString()
    media: string;
}