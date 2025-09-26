import { Document } from 'mongoose';

export interface IUserPreferences {
  projectsOrder?: string[];
}

export interface IUserSettings extends Document {
  language: string | undefined;
}

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  settings: IUserSettings;
  preferences: IUserPreferences;
}
