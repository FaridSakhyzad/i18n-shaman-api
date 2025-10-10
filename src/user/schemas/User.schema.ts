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
  verificationEpoch: Date,
  role: String,
  active: {
    type: Boolean,
    default: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  settings: UserSettingsSchema,
  preferences: UserPreferencesSchema,
});
