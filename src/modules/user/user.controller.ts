import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiQueryGetMany,
  QueryGet,
} from 'src/common/decorators/common.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from './decorator/getUser.decorator';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { UpdateUserDTO } from './dto/updateUser.dto';
import { UserDTO } from './dto/user.dto';
import { User, UserDocument } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  @ApiCreatedResponse({
    type: UserDTO,
  })
  async createUser(@Body() user: RegisterUserDTO): Promise<ResponseDTO> {
    return ResponseTool.CREATED(
      await this.userService.createUser(user as User),
    );
  }

  @Post('/follow/anonymous')
  async followAnonymous(@Body() body: any) {
    return ResponseTool.POST_OK(await this.userService.followAnonymous(body));
  }

  @Get()
  @ApiQueryGetMany()
  @UseGuards(MyTokenAuthGuard)
  @ApiOkResponse({
    type: ResponseDTO,
  })
  async getUsers(@QueryGet() query: QueryPostOption): Promise<ResponseDTO> {
    return ResponseTool.GET_OK(await this.userService.getUserList(query));
  }

  @Get('/me')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiOkResponse({ type: ResponseDTO })
  async getMyProfile(@GetUser() user: User): Promise<ResponseDTO> {
    return ResponseTool.GET_OK(user);
  }

  @Get('/popular')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiOkResponse({ type: ResponseDTO })
  @ApiQueryGetMany()
  async getPopularUsers(
    @GetUser() user: UserDocument,
    @QueryGet() query: QueryPostOption,
  ): Promise<ResponseDTO> {
    const { data, total } = await this.userService.getPopularUsers(
      user,
      query.options,
    );
    return ResponseTool.GET_OK(data, total);
  }

  @Get('/most-active')
  async getMostActiveUsers(): Promise<ResponseDTO> {
    return ResponseTool.GET_OK(await this.userService.getMostActiveUsers());
  }

  @Get('/:userId')
  @ApiOkResponse({ type: UserDTO })
  async getUserById(@Param('userId') userId: string): Promise<ResponseDTO> {
    return ResponseTool.GET_OK(await this.userService.findById(userId));
  }

  @Get('/admin/:userId')
  @ApiOkResponse({ type: UserDTO })
  async getUserByIdAdmin(
    @Param('userId') userId: string,
  ): Promise<ResponseDTO> {
    return ResponseTool.GET_OK(await this.userService.findByIdAdmin(userId));
  }

  @Patch('/update')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiOkResponse({ type: ResponseDTO })
  async updateMyProfile(
    @GetUser() oldUser,
    @Body() newUserInfo: UpdateUserDTO,
  ): Promise<ResponseDTO> {
    return ResponseTool.PATCH_OK(
      await this.userService.updateUser(oldUser._id, newUserInfo),
    );
  }

  @Patch('/update/ban-status/:userId')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  async updateBanStatusOfUser(
    @GetUser() requestUser: UserDocument,
    @Body()
    body: {
      status: string;
    },
    @Param('userId') userId: string,
  ): Promise<ResponseDTO> {
    return ResponseTool.PATCH_OK(
      await this.userService.updateBanStatusOfUser(
        requestUser,
        body.status,
        userId,
      ),
    );
  }

  @Patch('/update/:userId')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  async updateUserById(
    @GetUser() requestUser: UserDocument,
    @Body() userInfo: UserDTO,
    @Param('userId') userId: string,
  ): Promise<ResponseDTO> {
    return ResponseTool.PATCH_OK(
      await this.userService.updateUserById(userId, userInfo, requestUser),
    );
  }

  @Patch('/report/:userId')
  async reportTweet(@Param('userId') userId: string): Promise<ResponseDTO> {
    const user = await this.userService.reportUser(userId);
    return ResponseTool.PATCH_OK(user);
  }

  @Post('/follow/:userId')
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiCreatedResponse({ type: ResponseDTO })
  async followUser(
    @GetUser() user: UserDocument,
    @Param('userId') userToFollowId: string,
  ): Promise<ResponseDTO> {
    return ResponseTool.POST_OK(
      await this.userService.followUser(user, userToFollowId),
    );
  }

  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string): Promise<ResponseDTO> {
    return ResponseTool.DELETE_OK(await this.userService.deleteUser(userId));
  }
}
