import * as mongoose from 'mongoose';

export const KeyValueSchema = new mongoose.Schema({
  languageId: String,
  value: String,
});
