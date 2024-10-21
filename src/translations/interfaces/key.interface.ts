import { Document } from 'mongoose';

export interface IKey extends Document {
  userId: string;
  projectId: string;
  id: string;
  label: string;
  values: [any];
  description: string;
}
