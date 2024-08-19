import { Document } from 'mongoose';

export interface IUserSettings extends Document {
  language: string | undefined;
}

export interface IUser extends Document {
  id: string;
  login: string;
  password: string;
  settings: IUserSettings;
}