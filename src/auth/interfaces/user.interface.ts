import { Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  login: string;
  password: string;
}

export interface IUserDataForClient extends IUser {
  id: string;
  login: string;
}
