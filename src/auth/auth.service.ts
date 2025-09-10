import { Inject, Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Model, Types, UpdateWriteOpResult } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { MailService } from '../email/mail.service';

import { IUser, IPublicUserData, ISession } from './interfaces/user.interface';
import { IToken } from './interfaces/token.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<IUser>,
    @Inject('SESSION_MODEL')
    private sessionModel: Model<ISession>,
    @Inject('TOKEN_MODEL')
    private tokenModel: Model<IToken>,

    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {}

  async createUser({ email, password }: RegisterDto): Promise<IPublicUserData | Error> {
    const encryptedPassword = await bcrypt.hash(password, 12);

    const existingUser = await this.userModel.findOne({ email }).exec();

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const newUser = new this.userModel({
      email,
      password: encryptedPassword,
      createdAt: new Date(),
      role: 'user',
      settings: {
        language: 'en',
      },
    });

    const newUserDocument = await newUser.save();

    return {
      id: newUserDocument._id as string,
      email: newUserDocument.email,
    } as IPublicUserData;
  }

  async loginUser({ email, password }: LoginDto, session): Promise<IPublicUserData | Error> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new UnauthorizedException('Login/Passwords combination is incorrect');
    }

    const comparisonResult = await bcrypt.compare(password, user.password);

    if (!comparisonResult) {
      throw new UnauthorizedException('Login/Passwords combination is incorrect');
    }

    session.userId = user._id;
    session.userLoggedIn = true;

    return {
      id: user._id as string,
      email: user.email,
    } as IPublicUserData;
  }

  async logoutUser(userId: string) {
    const deleteResult = await this.sessionModel.deleteMany({
      'session.userId': new Types.ObjectId(userId),
    });

    return 'ok';
  }

  async verifyUser(userId: string): Promise<IPublicUserData | Error> {
    const user = await this.userModel.findOne({ _id: userId }).exec();

    if (!user) {
      return new ConflictException('User Not Found');
    }

    return {
      id: user._id as string,
      email: user.email,
    } as IPublicUserData;
  }

  async resetPasswordRequest(email: string): Promise<{ userId: string; resetToken: string }> {
    const user = await this.userModel.findOne({ email }).exec();

    await this.tokenModel.deleteMany({
      userId: user._id,
      type: 'password_reset',
    });

    const resetTokenDocument = await this.tokenService.createToken({
      userId: user._id as string,
      type: 'password_reset',
      expiresInMinutes: 60,
    });

    await this.mailService.sendResetPasswordEmail(email, resetTokenDocument.token);

    return {
      userId: user._id as string,
      resetToken: resetTokenDocument.token,
    };
  }

  async createPasswordResetSecurityToken(userId: string): Promise<string> {
    await this.tokenModel.deleteMany({
      userId,
      type: 'password_reset_security',
    });

    const resetSecurityTokenDocument = await this.tokenService.createToken({
      userId,
      type: 'password_reset_security',
      expiresInMinutes: 60,
    });

    return resetSecurityTokenDocument ? resetSecurityTokenDocument.token : null;
  }

  async setNewPassword(userId: string, password: string) {
    await this.tokenModel.deleteMany({
      userId,
      type: ['password_reset_security', 'password_reset'],
    });

    const result = await this.userModel.updateOne(
      { _id: userId },
      {
        password: await bcrypt.hash(password, 12),
      },
    );

    return result;
  }

  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userModel.findOne({ _id: userId });

    return await bcrypt.compare(password, user.password);
  }

  async updatePassword(userId: string, password: string): Promise<UpdateWriteOpResult> {
    await this.tokenModel.deleteMany({
      userId,
      type: ['password_update'],
    });

    const result = await this.userModel.updateOne(
      { _id: userId },
      {
        password: await bcrypt.hash(password, 12),
      },
    );

    return result;
  }
}
