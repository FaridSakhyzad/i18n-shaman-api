import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { SetLanguageDto } from './dto/setLanguage.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('setLanguage')
  async setLanguage(@Body() setLanguageDto: SetLanguageDto): Promise<string> {
    const { userId, language } = setLanguageDto;

    return this.userService.setLanguage(userId, language);
  }
}
