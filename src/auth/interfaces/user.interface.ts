import { Document } from 'mongoose';

export interface IUserSettings extends Document {
  language: string | undefined;
}

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  settings: IUserSettings;
}

export interface IPublicUserData {
  id: string;
  email: string;
  settings?: IUserSettings;
}

export interface IResetPasswordResponse {
  result: string;
}

export interface ISession extends Document {
  expires: Date;
  session: object;
}
