import * as mongoose from 'mongoose';

export const KeyValueSchema = new mongoose.Schema({
  id: String,
  userId: String,
  projectId: String,
  parentId: String,
  keyId: String,
  languageId: String,
  value: String,
  pathCache: String,
});
