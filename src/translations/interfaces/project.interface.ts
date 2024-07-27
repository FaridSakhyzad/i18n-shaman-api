import { Document } from 'mongoose';
import { IKey } from './key.interface';

export interface IProject extends Document {
  projectName: string;
  projectId: string;
  userId: string;
  keys: [IKey];
  languages: [];
}
