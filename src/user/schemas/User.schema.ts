import * as mongoose from 'mongoose';

export const UserSettingsSchema = new mongoose.Schema({
  language: String,
});

export const UserPreferencesSchema = new mongoose.Schema({
  projectsOrder: [String],
});

export const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  createdAt: Date,
  role: String,
  settings: UserSettingsSchema,
  preferences: UserPreferencesSchema,
});
