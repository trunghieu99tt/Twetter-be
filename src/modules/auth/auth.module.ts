import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';

// service
import { AuthService } from './auth.service';

// controller
import { AuthController } from './auth.controller';

// module
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';

// env
import { JWT_EXP, JWT_SECRET } from 'src/config/env';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UserModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: JWT_EXP
      }
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController]
})
export class AuthModule { }
