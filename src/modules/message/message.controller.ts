import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiQueryGetMany, QueryGet } from "src/common/decorators/common.decorator";
import { ResponseDTO } from "src/common/dto/response.dto";
import { MyTokenAuthGuard } from "src/common/guards/token.guard";
import { QueryPostOption } from "src/tools/request.tool";
import { ResponseTool } from "src/tools/response.tool";
import { GetUser } from "../user/decorator/getUser.decorator";
import { UserDocument } from "../user/user.entity";
import { MessageService } from "./message.service";

@Controller('messages')
export class MessageController {

    @Inject()
    private readonly messageService: MessageService;

    @Get('/:roomId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getRoomMessages(@GetUser() user: UserDocument, @Param('roomId') roomId: string, @QueryGet() query: QueryPostOption): Promise<ResponseDTO> {
        const { data, total } = await this.messageService.getRoomMessages(roomId, query.options);
        return ResponseTool.GET_OK(data, total);
    }

}