import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GenerateTokenDTO {
    @IsString()
    @IsNotEmpty()
    channelName: string;
}
