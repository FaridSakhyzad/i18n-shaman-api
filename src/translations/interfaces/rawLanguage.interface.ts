import { Document } from 'mongoose';

export interface IRawLanguage extends Document {
  id: string;
  label: string;
  code: string;
}
