import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from './decorator/getUser.decorator';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { UpdateUserDTO } from './dto/updateUser.dto';
import { UserDTO } from './dto/user.dto';
import { User, UserDocument } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
@ApiTags("Users")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('/register')
    @ApiCreatedResponse({
        type: UserDTO
    })
    async createUser(@Body() user: RegisterUserDTO): Promise<ResponseDTO> {
        return ResponseTool.CREATED(await this.userService.createUser(user as User))
    }

    @Get('/me')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiOkResponse({ type: ResponseDTO })
    async getMyProfile(@GetUser() user: User): Promise<ResponseDTO> {
        return ResponseTool.GET_OK(user)
    }

    @Get('/:userId')
    @ApiOkResponse({ type: UserDTO })
    async getUserById(@Param('userId') userId: string): Promise<ResponseDTO> {
        return ResponseTool.GET_OK(await this.userService.findById(userId));
    }

    @Patch('/update')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiOkResponse({ type: ResponseDTO })
    async updateMyProfile(@GetUser() oldUser, @Body() newUserInfo: UpdateUserDTO): Promise<ResponseDTO> {
        return ResponseTool.PATCH_OK(await this.userService.updateUser(oldUser.username, newUserInfo))
    }

    @Post('/follow/:userId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiCreatedResponse({ type: ResponseDTO })
    async followUser(@GetUser() user: UserDocument, @Param('userId') userToFollowId: string): Promise<ResponseDTO> {
        return ResponseTool.POST_OK(await this.userService.followUser(user, userToFollowId))
    }

    @Post('/save/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiCreatedResponse({ type: ResponseDTO })
    async saveTweet(@GetUser() user: UserDocument, @Param('tweetId') tweetId: string): Promise<ResponseDTO> {
        return ResponseTool.POST_OK(await this.userService.saveTweet(tweetId, user))
    }

}