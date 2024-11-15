import * as mongoose from 'mongoose';
import { KeyValueSchema } from './KeyValue.schema';

export const KeySchema = new mongoose.Schema({
  id: String,
  userId: String,
  projectId: String,
  parentId: String,
  label: String,
  values: [KeyValueSchema],
  description: String,
  type: String,
});
