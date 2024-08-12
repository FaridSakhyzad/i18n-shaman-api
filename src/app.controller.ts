import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(@Req() request): string {
    request.session.test = 'test 1024';

    return 'HELLO WORLD';
  }
}
