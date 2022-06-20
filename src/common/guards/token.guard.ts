import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class MyTokenAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info: Error) {
    if (err) throw err;
    if (info instanceof TokenExpiredError) {
      throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
