import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiQueryGetMany } from "src/common/decorators/common.decorator";
import { ResponseDTO } from "src/common/dto/response.dto";
import { MyTokenAuthGuard } from "src/common/guards/token.guard";
import { ResponseTool } from "src/tools/response.tool";
import { RoomService } from "./room.service";

@Controller('room')
export class RoomController {
    @Inject()
    private readonly roomService: RoomService;

    @Get('/:roomId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getRoomMessages(@Param('roomId') roomId: string): Promise<ResponseDTO> {
        const room = await this.roomService.findById(roomId);
        return ResponseTool.GET_OK(room);
    }
}