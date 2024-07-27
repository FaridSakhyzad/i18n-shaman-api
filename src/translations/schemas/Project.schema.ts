import * as mongoose from 'mongoose';
import { LanguageSchema } from './Language.schema';
import { KeySchema } from './Key.schema';

export const ProjectSchema = new mongoose.Schema({
  userId: String,
  projectName: String,
  projectId: String,
  keys: [KeySchema],
  languages: [LanguageSchema],
});
