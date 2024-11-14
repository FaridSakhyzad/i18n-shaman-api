import { Document } from 'mongoose';

export interface IKeyValue extends Document {
  id: string;
  userId: string;
  projectId: string;
  keyId: string;
  languageId: string;
  value: string;
}
