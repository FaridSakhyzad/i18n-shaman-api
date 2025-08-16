import { Body, Req, ConflictException, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IResetPasswordResponse, IUser } from './interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req): Promise<IUser | Error> {
    return this.authService.loginUser(loginDto, req.session);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<IUser | Error> {
    if (!registerDto.login || !registerDto.password) {
      throw new ConflictException('Error: Insufficient credentials');
    }

    return this.authService.createUser(registerDto);
  }

  @Get('verifyUser')
  async verify(@Req() req): Promise<IUser | Error> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      return new ConflictException('Error: Invalid Session');
    }

    return this.authService.verifyUser(session.userId);
  }

  @Get('resetPassword')
  async resetPassword(@Req() req, @Query('email') email: string): Promise<IResetPasswordResponse | Error | string> {
    const { session, sessionID } = req;

    if (session || sessionID || session.userId) {
      //return new ConflictException('Error: Logout Before Reset Password');
    }

    return this.authService.resetPassword(email);
  }
}
