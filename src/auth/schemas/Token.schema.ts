import { Schema, Types } from 'mongoose';

export const TokenSchema = new Schema({
  userId: { type: Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset', 'password_reset_security', 'password_update'],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
});

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
