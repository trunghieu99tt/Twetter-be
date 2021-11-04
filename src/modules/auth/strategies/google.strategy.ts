import { BadRequestException, Injectable } from '@nestjs/common';

import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcryptjs';
const GoogleTokenStrategy = require("passport-google-token").Strategy;
import { use } from 'passport';
import { GOOGLE_CLIENT_ID, GOOGLE_SECRET } from 'src/common/config/env';
import { AuthTool } from '../tool/auth.tool';


@Injectable()
export class GoogleStrategy {
    constructor(private readonly userService: UserService) {
        this.init();
    }

    init() {
        use(
            "google",
            new GoogleTokenStrategy(
                {
                    clientID: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_SECRET,
                },
                async (
                    accessToken: string,
                    refreshToken: string,
                    profile: any,
                    done: (err: any, user?: any, info?: any) => void,
                ) => {
                    const user = await this.userService.findByGoogleId(profile.id);

                    if (user) {
                        user.password = undefined;
                        return done(null, user);
                    } else {
                        if (profile._json.email) {
                            const existedEmail = await this.userService.findByUsernameOrEmail(profile._json.email);
                            if (existedEmail) {
                                return done(new BadRequestException("Email does exits!"));
                            }
                        }
                        return done(
                            null,
                            await this.userService
                                .createUser(
                                    {
                                        username: null,
                                        password: await bcrypt.hash(AuthTool.randomToken(), 10),
                                        name: profile._json.name,
                                        avatar: profile._json.picture,
                                        email: profile._json.email,
                                        passwordConfirm: null,
                                        google: {
                                            id: profile.id,
                                        },
                                    }
                                )
                                .then((result) => {
                                    return result;
                                }),
                        );
                    }
                }
            ),
        );
    }
}
