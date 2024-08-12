import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  login: String,
  password: String,
  createdAt: Date,
  role: String,
});
