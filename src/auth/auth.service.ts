import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { MailService } from '../email/mail.service';

import { IUser, IUserDataForClient } from './interfaces/user.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<IUser>,
    private readonly mailService: MailService,
  ) {}

  async createUser({ login, password }: RegisterDto): Promise<IUserDataForClient | Error> {
    const encryptedPassword = await bcrypt.hash(password, 12);

    const existingUser = await this.userModel.findOne({ login }).exec();

    if (existingUser) {
      throw new ConflictException('User with this login already exists');
    }

    const newUser = new this.userModel({
      login,
      password: encryptedPassword,
      createdAt: new Date(),
      role: 'user',
    });

    const newUserDocument = await newUser.save();

    return {
      id: newUserDocument._id as string,
      login: newUserDocument.login,
    } as IUserDataForClient;
  }

  async loginUser({ login, password }: LoginDto, session): Promise<IUserDataForClient | Error> {
    const user = await this.userModel.findOne({ login }).exec();

    if (!user) {
      throw new ConflictException('User not found');
    }

    const comparisonResult = await bcrypt.compare(password, user.password);

    if (!comparisonResult) {
      throw new ConflictException('Incorrect Password');
    }

    session.userId = user._id;

    return {
      id: user._id as string,
      login: user.login,
    } as IUserDataForClient;
  }

  async verifyUser(userId: string): Promise<IUserDataForClient | Error> {
    const user = await this.userModel.findOne({ _id: userId }).exec();

    if (!user) {
      return new ConflictException('User Not Found');
    }

    const { settings } = user;

    return {
      id: user._id as string,
      login: user.login,
      settings: {
        language: settings.language,
      },
    } as IUserDataForClient;
  }

  async resetPassword(email: string) {
    return this.mailService.sendHelloWorld(email);
  }
}
