import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWT_SECRET } from "src/config/env";
import { TokenService } from "src/modules/token/token.service";
import { User } from "src/modules/user/user.entity";
import { UserService } from "src/modules/user/user.service";
import { PayloadDTO } from "../dto/payload.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,

    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_SECRET,
        });
    }

    async validate(payload: PayloadDTO): Promise<User> {
        const { sub, jti } = payload;
        const user = await this.userService.findById(sub);
        if (!user) {
            throw new UnauthorizedException();
        }
        user.jti = payload.jti;
        const checkJwt = await this.tokenService.checkJWTKey(sub, jti);
        console.log(`checkJwt`, checkJwt)
        if (!checkJwt) {
            throw new UnauthorizedException("Invalid Jwt Token");
        }
        return user;
    }
}