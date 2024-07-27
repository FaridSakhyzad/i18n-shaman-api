import * as mongoose from 'mongoose';

export const LanguageSchema = new mongoose.Schema({
  id: String,
  label: String,
  baseLanguage: Boolean,
});
