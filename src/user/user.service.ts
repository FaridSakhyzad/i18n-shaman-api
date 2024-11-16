import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<IUser>,
  ) {}

  async setLanguage(userId: string, language: string) {
    const result = await this.userModel.updateOne(
      { _id: userId },
      {
        settings: {
          language: language,
        },
      },
    );

    return 'OK';
  }
}
