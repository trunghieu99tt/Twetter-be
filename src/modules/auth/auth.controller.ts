import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDTO } from '../user/dto/user.dto';
import { UserDocument } from '../user/user.entity';
import { AuthService } from './auth.service';
import { AccessTokenResponse } from './dto/accessTokenResponse.dto';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
@ApiTags("Auth")
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post('/signup')
    @ApiOkResponse({
        type: AccessTokenResponse
    })
    async signUp(@Body() userDto: UserDTO): Promise<AccessTokenResponse> {
        return this.authService.signUp(userDto);
    }

    @Post('/signin')
    @ApiOkResponse({
        type: AccessTokenResponse
    })
    async signIn(@Body() loginDTO: LoginDTO): Promise<AccessTokenResponse> {
        return this.authService.signIn(loginDTO);
    }

    @Post('/google')
    @ApiOkResponse({
        type: AccessTokenResponse
    })
    async googleAuth(@Body('tokenId') tokenId: string): Promise<AccessTokenResponse> {
        return this.authService.googleLogin(tokenId);
    }

    @Post('/github')
    @ApiOkResponse({
        type: AccessTokenResponse
    })
    async githubAuth(@Body('code') code: string): Promise<AccessTokenResponse> {
        return this.authService.githubLogin(code);
    }

    @Post('/logout')
    @ApiOkResponse()
    @UseGuards(MyTokenAuthGuard)
    async logout(@GetUser() user): Promise<{ message: string }> {
        return await this.authService.logout(user as UserDocument);
    }
}
