import { Document } from 'mongoose';

export interface IProject extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}