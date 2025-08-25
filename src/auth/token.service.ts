import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { ICreateToken, IToken } from './interfaces/token.interface';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    @Inject('TOKEN_MODEL')
    private readonly tokenModel: Model<IToken>,
  ) {}

  async createToken(data: ICreateToken): Promise<IToken> {
    const { userId, type, expiresInMinutes = 30, metadata = {} } = data;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const tokenDoc = new this.tokenModel({
      userId,
      token,
      type,
      expiresAt,
      metadata,
    });

    return tokenDoc.save();
  }

  async verifyToken(token: string, type: IToken['type']): Promise<IToken | null> {
    const tokenDoc = await this.tokenModel.findOne({ token, type });

    if (!tokenDoc || tokenDoc.expiresAt < new Date() || tokenDoc.used) {
      return null;
    }

    return tokenDoc;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.tokenModel.updateOne({ token }, { $set: { used: true } });
  }

  async deleteToken(token: string): Promise<void> {
    await this.tokenModel.deleteOne({ token });
  }
}
