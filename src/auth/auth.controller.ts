import { Body, Req, ConflictException, Controller, Get, Post, Query, HttpStatus, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto } from './dto/login.dto';
import { RegisterDto, SetNewPasswordDto } from './dto/register.dto';
import { IResetPasswordResponse, IPublicUserData, IUpdatePassword } from './interfaces/user.interface';
import { ApiResponse, ProblemDetails } from '../interfaces';
import { TokenService } from './token.service';
import { ValidationService } from '../validation/validation.servise';
import { Model } from 'mongoose';
import { IToken } from './interfaces/token.interface';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('TOKEN_MODEL')
    private tokenModel: Model<IToken>,

    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly validationService: ValidationService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req): Promise<IPublicUserData | Error> {
    return this.authService.loginUser(loginDto, req.session);
  }

  @Post('logout')
  async logout(@Req() req, @Body() logoutDto: LogoutDto): Promise<string | Error> {
    const { userId } = logoutDto;

    await req.session.destroy();

    return this.authService.logoutUser(userId);
  }

  @Post('register')
  async register(@Req() req, @Body() registerDto: RegisterDto): Promise<ApiResponse<IPublicUserData> | ProblemDetails> {
    const nowDate = new Date().toISOString();

    if (!registerDto.email || !registerDto.password) {
      return {
        type: '',
        title: 'Registration Failed',
        status: HttpStatus.BAD_REQUEST,
        detail: 'Insufficient credentials',
        code: '400',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    let data;

    try {
      data = await this.authService.createUser(registerDto);

      const { id: newUserId, email } = data;

      await this.authService.initEmailVerification(email, newUserId.toString());
    } catch (error) {
      const body = error.getResponse() as any;

      return {
        type: '',
        title: 'Registration Failed',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: body.message,
        code: body.statusCode,
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    return {
      success: true,
      data,
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  //: Promise<ApiResponse<any> | ProblemDetails>

  @Post('validateVerificationToken')
  async validateVerificationToken(@Req() req, @Body() { verificationToken }: { verificationToken: string }) {
    const verificationTokenDocument = await this.tokenService.verifyToken(verificationToken, 'email_verification');

    const nowDate = new Date().toISOString();

    if (!verificationTokenDocument) {
      return {
        type: '',
        title: 'Verification Token is Invalid',
        status: HttpStatus.BAD_REQUEST,
        detail: 'Error: Forbidden',
        code: '400',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    const { token, used } = verificationTokenDocument;

    return {
      success: !used && verificationToken === token,
      data: { token, used },
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  @Post('getEmailVerificationSecurityToken')
  async getEmailVerificationSecurityToken(@Req() req, @Body() { verificationToken }: { verificationToken: string }) {
    console.log('getEmailVerificationSecurityToken');
    console.log('verificationToken', verificationToken);

    const verificationTokenDocument = await this.tokenModel.findOne({
      token: verificationToken,
      type: 'email_verification',
    });

    const nowDate = new Date().toISOString();

    if (!verificationTokenDocument) {
      return {
        type: '',
        title: 'Verification Token not Found',
        status: HttpStatus.NOT_FOUND,
        detail: 'Error: Forbidden',
        code: '400',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    console.log('verificationTokenDocument', verificationTokenDocument);

    const emailVerificationSecurityToken = await this.authService.createEmailVerificationSecurityToken(verificationTokenDocument.userId.toString());

    console.log('emailVerificationSecurityToken', emailVerificationSecurityToken);
    console.log(' ');
    console.log(' ');
    console.log('*');
    console.log(' ');
    console.log(' ');

    return {
      success: true,
      data: {
        token: emailVerificationSecurityToken,
      },
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  @Post('verifyEmail')
  async verifyEmail(@Req() req, @Body() { verificationToken, verificationSecurityToken }: { verificationToken: string; verificationSecurityToken: string }) {
    const verificationTokenDocument = await this.tokenService.verifyToken(verificationToken, 'email_verification');
    const verificationSecurityTokenDocument = await this.tokenService.verifyToken(verificationSecurityToken, 'email_verification_security');

    const nowDate = new Date().toISOString();

    if (!verificationSecurityTokenDocument || !verificationTokenDocument) {
      return {
        type: '',
        title: 'Verification Security Token is Invalid',
        status: HttpStatus.BAD_REQUEST,
        detail: 'Error: Forbidden',
        code: '400',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    const emailVerificationResult = await this.authService.verifyEmail(
      verificationSecurityTokenDocument.userId.toString(),
      verificationTokenDocument,
    );

    const { token, used } = verificationSecurityTokenDocument;

    return {
      success: emailVerificationResult.success,
      data: {
        token,
        used,
        message: emailVerificationResult.data,
      },
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  @Get('verifyUser')
  async verify(@Req() req): Promise<IPublicUserData | Error> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId || !session.userLoggedIn) {
      return new ConflictException('Error: Invalid Session');
    }

    return this.authService.verifyUser(session.userId);
  }

  @Get('resetPasswordRequest')
  async resetPasswordRequest(@Req() req, @Query('email') email: string): Promise<IResetPasswordResponse | Error | string> {
    const { session, sessionID } = req;

    if (session && sessionID && session.userId && session.userLoggedIn) {
      return new ConflictException('Error: Reset Password Operation is Forbidden');
    }

    const { userId, resetToken } = await this.authService.resetPasswordRequest(email);

    session.userId = userId;
    session.resetToken = resetToken;

    return 'Reset Password Request Successful';
  }

  @Get('getPasswordResetSecurityToken')
  async getPasswordResetSecurityToken(@Req() req): Promise<ProblemDetails | ApiResponse<any>> {
    if (req.session.userId && req.session.userLoggedIn) {
      return {
        type: '',
        title: 'Insufficient credentials',
        status: HttpStatus.BAD_REQUEST,
        detail: 'Error: Request Params are corrupt or missing.',
        code: '400',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      };
    }

    const resetSecurityToken = await this.authService.createPasswordResetSecurityToken(req.session.userId);

    if (!resetSecurityToken || resetSecurityToken.length < 1) {
      return {
        type: '',
        title: 'Security Token Not Found',
        status: HttpStatus.NOT_FOUND,
        detail: 'Error: Forbidden',
        code: '404',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      };
    }

    req.session.resetSecurityToken = resetSecurityToken;

    return {
      success: true,
      data: { token: resetSecurityToken },
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
      path: req.url as string,
    };
  }

  @Post('setNewPassword')
  async setNewPassword(@Req() req, @Body() setNewPasswordDto: SetNewPasswordDto): Promise<ProblemDetails | ApiResponse<any>> {
    const { session } = req;

    const { password, resetToken, securityToken } = setNewPasswordDto;

    const nowDate = new Date().toISOString();

    if (password.length < 3) {
      return {
        type: '',
        title: 'Reset Password Failed',
        status: HttpStatus.NOT_ACCEPTABLE,
        detail: 'Error: Data is invalid',
        code: '406',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    delete session.userLoggedIn;

    const resetTokenDocument = await this.tokenService.verifyToken(session.resetToken, 'password_reset');
    const resetSecurityTokenDocument = await this.tokenService.verifyToken(session.resetSecurityToken, 'password_reset_security');

    if (!resetTokenDocument) {
      delete session.resetToken;
    }

    if (!resetSecurityTokenDocument) {
      delete session.resetSecurityToken;
    }

    if (!resetTokenDocument || !resetSecurityTokenDocument || resetToken !== resetTokenDocument.token || securityToken !== resetSecurityTokenDocument.token) {
      return {
        type: '',
        title: 'Reset Password Failed',
        status: HttpStatus.FORBIDDEN,
        detail: 'Error: Forbidden',
        code: '403',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    const setNewPasswordResult = await this.authService.setNewPassword(session.userId, password);

    delete session.userId;
    delete session.resetToken;
    delete session.resetSecurityToken;

    return {
      success: true,
      data: {
        ...setNewPasswordResult,
      },
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  @Post('validateResetToken')
  async validateResetToken(@Req() req, @Body() { resetToken }: { resetToken: string }): Promise<ProblemDetails | ApiResponse<any>> {
    const resetTokenDocument = await this.tokenService.verifyToken(resetToken, 'password_reset');

    const nowDate = new Date().toISOString();

    if (!resetTokenDocument) {
      return {
        type: '',
        title: 'Reset Token is Invalid',
        status: HttpStatus.BAD_REQUEST,
        detail: 'Error: Forbidden',
        code: '400',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    const { token, used } = resetTokenDocument;

    return {
      success: !used && resetToken === token,
      data: { token, used },
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  @Get('getUpdatePasswordSecurityToken')
  async getUpdatePasswordSecurityToken(@Req() req, @Query('userId') userId: string): Promise<ProblemDetails | ApiResponse<any>> {
    const { session } = req;

    const nowDate = new Date().toISOString();

    if (!session || !session.userId || !session.userLoggedIn || userId !== session.userId.toString()) {
      return {
        type: '',
        title: 'Get Update Password Token Failed',
        status: HttpStatus.FORBIDDEN,
        detail: 'Error: Forbidden',
        code: '403',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    await this.tokenModel.deleteMany({
      userId: session.userId,
      type: 'password_update',
    });

    const updateTokenDocument = await this.tokenService.createToken({
      userId: session.userId,
      type: 'password_update',
      expiresInMinutes: 10,
    });

    session.passwordUpdateToken = updateTokenDocument.token;

    return {
      success: true,
      data: { token: updateTokenDocument.token },
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }

  @Post('updatePassword')
  async updatePassword(@Req() req, @Body() { userId, securityToken, password, newPassword, confirmPassword }: IUpdatePassword): Promise<ProblemDetails | ApiResponse<any>> {
    const { session } = req;

    const isPasswordValid = await this.authService.verifyUserPassword(userId, password);

    const updateTokenDocument = await this.tokenService.verifyToken(securityToken, 'password_update');

    const nowDate = new Date().toISOString();

    if (!isPasswordValid || !updateTokenDocument || !session || !session.userId || !session.userLoggedIn || userId !== session.userId.toString()) {
      return {
        type: '',
        title: 'Update Password Failed',
        status: HttpStatus.FORBIDDEN,
        detail: 'Error: Forbidden',
        code: '403',
        errors: [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    const validationResult = this.validationService.validatePassword(newPassword);

    if (newPassword !== confirmPassword || !validationResult.success) {
      return {
        type: '',
        title: 'Update Password Failed',
        status: HttpStatus.NOT_ACCEPTABLE,
        detail: 'Error: Not Acceptable',
        code: '406',
        errors: validationResult.errors ? validationResult.errors.map((error) => ({ ...error, field: 'password' })) : [],
        requestId: req.headers['x-request-id'],
        timestamp: nowDate,
      };
    }

    const updatePasswordResult = await this.authService.updatePassword(session.userId, newPassword);

    delete session.passwordUpdateToken;

    return {
      success: true,
      data: {},
      requestId: req.headers['x-request-id'],
      timestamp: nowDate,
      path: req.url as string,
    };
  }
}
