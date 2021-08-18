import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { EAudience } from "src/config/constants";

export class CreateTweetDTO {
    @ApiProperty()
    @IsString()
    content: string;

    @ApiProperty()
    tags: string[];

    @ApiProperty()
    media: string[];

    @ApiProperty()
    audience: EAudience;
}