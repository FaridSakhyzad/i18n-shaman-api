import * as mongoose from 'mongoose';

export const RawLanguageSchema = new mongoose.Schema({
  id: String,
  label: String,
  code: String
});
