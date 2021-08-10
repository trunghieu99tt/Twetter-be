import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Authorization } from 'src/common/decorators/auth.decorator';
import { ApiCommonDecorator } from 'src/common/decorators/common.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from './decorator/getUser.decorator';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { UpdateUserDTO } from './dto/updateUser.dto';
import { UserDTO } from './dto/user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
@ApiCommonDecorator()
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
    @UseGuards(MyTokenAuthGuard)
    @ApiOkResponse({ type: ResponseDTO })
    async getMyProfile(@GetUser() user: User): Promise<ResponseDTO> {
        return ResponseTool.GET_OK(user)
    }

    @Patch('/update')
    @UseGuards(MyTokenAuthGuard)
    @ApiOkResponse({ type: ResponseDTO })
    async updateMyProfile(@GetUser() oldUser, @Body() newUserInfo: UpdateUserDTO): Promise<ResponseDTO> {
        return ResponseTool.PATCH_OK(await this.userService.updateUser(oldUser.username, newUserInfo))
    }

}