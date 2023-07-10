import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QueryGet } from 'src/common/decorators/common.decorator';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDocument } from '../user/user.entity';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(MyTokenAuthGuard)
  async create(@GetUser() user: UserDocument, @Body() notificationDto: any) {
    return this.notificationService.createNotification(user, notificationDto);
  }

  @Get()
  @UseGuards(MyTokenAuthGuard)
  async getAll(
    @GetUser() user: UserDocument,
    @QueryGet() query: QueryPostOption,
  ) {
    const { data, total } = await this.notificationService.getNotifications(
      user._id,
      query,
    );
    return ResponseTool.GET_OK(data, total);
  }

  @Delete()
  @UseGuards(MyTokenAuthGuard)
  async deleteAll(@GetUser() user: UserDocument) {
    await this.notificationService.deleteAllNotifications(user._id);
    return ResponseTool.DELETE_OK({
      message: 'OK',
    });
  }

  @Patch('/read')
  @UseGuards(MyTokenAuthGuard)
  async readMultiNotifications(
    @GetUser() user: UserDocument,
    @Body('ids') ids: string[],
  ) {
    const updatedNotification =
      await this.notificationService.updateReadStatusNotifications(
        user._id,
        ids,
      );
    return ResponseTool.PATCH_OK(updatedNotification);
  }

  @Patch('/read/:id')
  @UseGuards(MyTokenAuthGuard)
  async read(@GetUser() user: UserDocument, @Param('id') id: string) {
    const updatedNotification =
      await this.notificationService.updateReadStatusNotification(user._id, id);
    return ResponseTool.PATCH_OK(updatedNotification);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    const deletedNotification =
      await this.notificationService.deleteNotification(id);
    return ResponseTool.DELETE_OK(deletedNotification);
  }
}
