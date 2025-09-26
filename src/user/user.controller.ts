import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { SetLanguageDto, SetPreferencesDto } from './dto/setLanguage.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('setLanguage')
  async setLanguage(@Body() setLanguageDto: SetLanguageDto): Promise<string> {
    const { userId, language } = setLanguageDto;

    return this.userService.setLanguage(userId, language);
  }

  @Post('savePreferences')
  async savePreferences(@Body() setPreferencesDto: SetPreferencesDto): Promise<string> {
    const { userId, data } = setPreferencesDto;

    return this.userService.savePreferences(userId, data);
  }
}
