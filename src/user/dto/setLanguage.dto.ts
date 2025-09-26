import { IUserPreferences } from '../interfaces/user.interface';

export class SetLanguageDto {
  userId: string;
  language: string;
}

export class SetPreferencesDto {
  userId: string;
  data: IUserPreferences;
}
