import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsString } from "class-validator";

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
}