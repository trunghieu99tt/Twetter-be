import { Controller, Get } from '@nestjs/common';

@Controller('app')
export class AppController {
  @Get('/')
  test(): void {
    for (let i = 0; i < 1e10; i += 1) {}

    console.log('finished');
  }
}
