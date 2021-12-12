import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcryptjs';
const { OAuth2Client } = require('google-auth-library');

// entity
import { UserDocument } from '../user/user.entity';

// dto
import { LoginDTO } from './dto/login.dto';
import { UserDTO } from '../user/dto/user.dto';
import { PayloadDTO } from './dto/payload.dto';
import { AccessTokenResponse } from './dto/accessTokenResponse.dto';

// service
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';

// tool
import { AuthTool } from './tool/auth.tool';
import { EmailTool } from 'src/common/tool/email.tool';

// env
import {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URL,
    GOOGLE_CLIENT_ID,
    JWT_EXP,
} from 'src/common/config/env';
import { SMTPMailer } from 'src/common/config/mailer';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly tokenService: TokenService,
        private readonly httpService: HttpService,
    ) {}

    // create jwt access token based on userId
    async generateAccessToken(
        userId,
        timestamp: number = Date.now(),
    ): Promise<string> {
        const jti = new ObjectId().toHexString();
        const payload = {
            sub: userId,
            jti,
        } as PayloadDTO;

        await this.tokenService.setJWTKey(userId, jti, JWT_EXP, timestamp);

        const accessToken = this.jwtService.sign(payload);
        return accessToken;
    }

    async signUp(
        userDto: UserDTO,
        timestamp: number = Date.now(),
    ): Promise<AccessTokenResponse> {
        const newUser = await this.userService.createUser({
            ...userDto,
            isThirdParty: false,
        });
        const accessToken = await this.generateAccessToken(
            newUser.id,
            timestamp,
        );
        return {
            user: newUser,
            accessToken,
        };
    }

    async signIn(
        loginDto: LoginDTO,
        timestamp: number = Date.now(),
    ): Promise<AccessTokenResponse> {
        const { username, password } = loginDto;
        const user = await this.userService.findByUsernameOrEmail(username);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const isCorrectPassword = await user.comparePassword(password);
        if (!isCorrectPassword) {
            throw new UnauthorizedException('Wrong username/password');
        }
        const accessToken = await this.generateAccessToken(user.id, timestamp);
        return {
            user,
            accessToken,
        };
    }

    async logout(user: UserDocument): Promise<{ message: string }> {
        try {
            await this.tokenService.deleteJWTKey(user.id, user.jti);

            // delete all expired tokens
            await this.tokenService.deleteExpiredJWTKeys();

            return {
                message: 'Good bye :)',
            };
        } catch (error) {
            console.error(error);
        }
    }

    async googleLogin(tokenId: string): Promise<AccessTokenResponse> {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const response = await client.verifyIdToken({
            idToken: tokenId,
            audience: GOOGLE_CLIENT_ID,
        });
        console.log(`response.payload`, response.payload);
        const {
            email_verified,
            name,
            email,
            given_name,
            family_name,
            sub,
            picture,
        } = response.payload;

        if (email_verified) {
            let user = null;
            try {
                user = await this.userService.findByUsernameOrEmail(email);
            } catch (error) {}
            if (user) {
                // If user with email already exists, return user data and access token
                const accessToken = await this.generateAccessToken(
                    user._id,
                    Date.now(),
                );
                return {
                    user,
                    accessToken,
                };
            } else {
                try {
                    /**
                     *  If not, create a new user based on with google account information
                     *  Note that we will generate a mock username and password
                     *  so after logging in using google, if use want to switch to username/password auth,
                     *  user must update username and password first!
                     *  */
                    const initialPassword = await bcrypt.hash(
                        AuthTool.randomToken(),
                        10,
                    );
                    const newUser = await this.userService.createUser({
                        username: `${email}-${new Date().getTime()}`,
                        password: initialPassword,
                        name: `${family_name} ${given_name}`,
                        avatar: picture,
                        email,
                        bio: '',
                        passwordConfirm: initialPassword,
                        google: {
                            id: sub,
                        },
                        isThirdParty: true,
                    });

                    const accessToken = await this.generateAccessToken(
                        newUser._id,
                        Date.now(),
                    );

                    return {
                        user: newUser,
                        accessToken,
                    };
                } catch (error) {
                    console.log(`error`, error);
                }
            }
        } else {
            throw new BadRequestException(
                'This account has not verified yet. Please verify it before logging',
            );
        }
    }

    async githubLogin(code: string): Promise<AccessTokenResponse> {
        // get access token
        const payload = {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
            redirect_url: GITHUB_REDIRECT_URL,
        };
        const url = 'https://github.com/login/oauth/access_token';
        const responseToken = await this.httpService
            .post(url, payload)
            .toPromise();
        const params = new URLSearchParams(responseToken.data);
        const accessToken = params.get('access_token');

        // get user info
        const responseUser = await this.httpService
            .get(`https://api.github.com/user`, {
                headers: {
                    Authorization: `token ${accessToken}`,
                },
            })
            .toPromise();

        const { email, avatar_url, name, bio, id } = responseUser.data;

        let user = null;
        if (email) {
            user = await this.userService.findByUsernameOrEmail(email);
        }
        if (user) {
            const accessToken = await this.generateAccessToken(
                user._id,
                Date.now(),
            );
            return {
                user,
                accessToken,
            };
        } else {
            try {
                /**
                 *  If not, create a new user based on with github account information
                 *  Note that we will generate a mock username and password
                 *  so after logging in using github, if use want to switch to username/password auth,
                 *  user must update username and password first!
                 *  */
                const initialPassword = await bcrypt.hash(
                    AuthTool.randomToken(),
                    10,
                );
                const newUser = await this.userService.createUser({
                    username: `${email}-${new Date().getTime()}`,
                    password: initialPassword,
                    name: `${name}`,
                    avatar: avatar_url,
                    email,
                    bio: bio,
                    passwordConfirm: initialPassword,
                    github: {
                        id: id,
                    },
                    isThirdParty: true,
                });

                const accessToken = await this.generateAccessToken(
                    newUser._id,
                    Date.now(),
                );

                return {
                    user: newUser,
                    accessToken,
                };
            } catch (error) {
                console.log(`error`, error);
            }
        }
    }

    async resetPassword(email: string) {
        const user = await this.userService.findByUsernameOrEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        try {
            const token = AuthTool.randomToken(6);

            // delete all tokens of this user
            const deleteResponse =
                await this.tokenService.deleteJWTKeysByUserID(user._id);

            const updateResponse = await this.userService.updateUser(user._id, {
                password: token,
            });

            SMTPMailer.sendMail(
                user.email,
                'Quen mat khau',
                EmailTool.resetPasswordEmail(user.name, user.username, token),
            );
            return {
                message: 'OK',
            };
        } catch (error) {
            console.log(`error`, error);
            throw new InternalServerErrorException('Internal server error');
        }
    }
}
