import * as mongoose from 'mongoose';
import { KeyValueSchema } from './KeyValue.schema';

export const KeySchema = new mongoose.Schema({
  userId: String,
  projectId: String,
  id: String,
  label: String,
  values: [KeyValueSchema],
  description: String,
});
