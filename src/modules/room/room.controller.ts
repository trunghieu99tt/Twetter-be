import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiQueryGetMany } from 'src/common/decorators/common.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDocument } from '../user/user.entity';
import { RoomDTO } from './dto/create-room.dto';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  @Inject()
  private readonly roomService: RoomService;

  @Get('/myRoom')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  async getUserRooms(@GetUser() user: UserDocument): Promise<ResponseDTO> {
    const rooms = await this.roomService.getRoomByUser(user);
    return ResponseTool.GET_OK(rooms);
  }

  @Get('/:roomId')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiQueryGetMany()
  async getRoomMessages(@Param('roomId') roomId: string): Promise<ResponseDTO> {
    const room = await this.roomService.findById(roomId);
    return ResponseTool.GET_OK(room);
  }

  @Post()
  @UseGuards(MyTokenAuthGuard)
  async createNewRoom(@Body() body: RoomDTO) {
    const newRoom = await this.roomService.createRoom(body);

    return ResponseTool.POST_OK(newRoom);
  }

  @Delete('/:roomId')
  @UseGuards(MyTokenAuthGuard)
  async deleteRoom(
    @GetUser() user: UserDocument,
    @Param('roomId') roomId: string,
  ) {
    await this.roomService.deleteRoom(roomId, user);
    return ResponseTool.DELETE_OK('OK');
  }
}
